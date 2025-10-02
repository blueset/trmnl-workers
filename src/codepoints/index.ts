import type { RandomCodepointResponse } from "./types";
import { fetchRandomHex, fetchSvg, fetchMeta, fetchBlockSvg, fetchPlangothicSvg } from "./api";
import { labelProperties, processDescriptions, processSVG } from "./utils";

interface Env {
  TRMNL_WORKERS_KV: KVNamespace;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const KV_KEY = "codepoints_lkg";
    const TIMEOUT_MS = 4000;

    // Helper function to perform the main logic
    const performMainLogic = async (): Promise<string> => {
      const hex = url.searchParams.get("hex") || await fetchRandomHex();
      const [svg, meta] = await Promise.all([fetchSvg(hex), fetchMeta(hex)]);

      // If this is a CJK extension block (B..I) and either there is no glyph SVG
      // or the source is Unifont, attempt to fetch the PlanGothic SVG first and
      // use the fallback order: plangothicSvg > svg > blockSvg
      let plangothicSvg: string | null = null;
      const isCJKExt = /^CJK_Ext_[BCDEFGHI]$/.test(meta.blk || '');
      const imagesourceIsUnifont = meta._?.imagesource === 'Unifont';
      if (isCJKExt && (!svg || imagesourceIsUnifont)) {
        plangothicSvg = await fetchPlangothicSvg(hex);
        if (plangothicSvg && meta._) {
          meta._.imagesource = 'Plangothic';
        }
      }

      const primarySvg = plangothicSvg ?? svg;
      const blockSvg = primarySvg ? null : await fetchBlockSvg(meta);
      const codepoint = `U+${hex}`;
      const char = String.fromCodePoint(parseInt(hex, 16));
      const svgs = processSVG(primarySvg, meta, blockSvg);
      const descriptions = processDescriptions(meta);
      labelProperties(meta);

      delete meta._;

      const payload: RandomCodepointResponse = {
        hex, codepoint, char, meta, svgs, descriptions
      };
      return JSON.stringify(payload, null, 2);
    };

    // Wrap main logic with timeout
    const mainLogicWithTimeout = Promise.race([
      performMainLogic(),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Timeout")), TIMEOUT_MS)
      ),
    ]);

    try {
      const body = await mainLogicWithTimeout;
      
      // Store successful response in KV
      await env.TRMNL_WORKERS_KV.put(KV_KEY, body);

      return new Response(body, {
        status: 200,
        headers: {
          "content-type": "application/json; charset=utf-8",
          "cache-control": "no-store",
        },
      });
    } catch (err) {
      // If main logic fails or times out, try to use cached value
      const cachedBody = await env.TRMNL_WORKERS_KV.get(KV_KEY);
      
      if (cachedBody) {
        return new Response(cachedBody, {
          status: 200,
          headers: {
            "content-type": "application/json; charset=utf-8",
            "cache-control": "no-store",
            "x-cache": "hit",
          },
        });
      }

      // No cached value available, return error
      const message = err instanceof Error ? err.message : "Unknown error";
      return new Response(
        JSON.stringify({ error: message }, null, 2),
        {
          status: 502,
          headers: {
            "content-type": "application/json; charset=utf-8",
            "cache-control": "no-store",
          },
        }
      );
    }

  },
};
