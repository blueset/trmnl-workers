import type { RandomCodepointResponse } from "./types";
import { fetchRandomHex, fetchSvg, fetchMeta, fetchBlockSvg, fetchPlangothicSvg } from "./api";
import { labelProperties, processDescriptions, processSVG } from "./utils";

export default {
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    try {
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
      const body = JSON.stringify(payload, null, 2);

      return new Response(body, {
        status: 200,
        headers: {
          "content-type": "application/json; charset=utf-8",
          "cache-control": "no-store",
        },
      });
    } catch (err) {
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
