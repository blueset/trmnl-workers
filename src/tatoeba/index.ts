import { bcp47Normalize } from "bcp-47-normalize";
import { Languages } from "./consts";

export default {
  async fetch(request: Request): Promise<Response> {
    try {
      const url = new URL(request.url);
      const query = url.search; // Remove the leading '?'

      // Step 1: fetch random sentences
      const searchResp = await fetch(`https://api.dev.tatoeba.org/unstable/sentences${query}`);
      if (!searchResp.ok) {
        console.error(`Tatoeba search endpoint failed: ${searchResp.status}, ${await searchResp.text()}`);
        return new Response(
          JSON.stringify({ error: `Upstream sentences endpoint failed: ${searchResp.status}` }, null, 2),
          {
            status: 502,
            headers: {
              "content-type": "application/json; charset=utf-8",
              "cache-control": "no-store",
            },
          }
        );
      }

      const searchJson: any = await searchResp.json();

      // Step 2: check if data exists
      if (!searchJson.data || !Array.isArray(searchJson.data) || searchJson.data.length === 0) {
        return new Response(
          JSON.stringify({ error: "No sentences found" }, null, 2),
          {
            status: 404,
            headers: {
              "content-type": "application/json; charset=utf-8",
              "cache-control": "no-store",
            },
          }
        );
      }

      // Step 3: get first sentence ID and fetch full sentence data
      const id = searchJson.data[0].id;
      const sentenceResp = await fetch(`https://api.dev.tatoeba.org/unstable/sentences/${id}`);
      if (!sentenceResp.ok) {
        console.error(`Tatoeba sentence endpoint failed: ${sentenceResp.status}, ${await sentenceResp.text()}`);
        return new Response(
          JSON.stringify({ error: `Upstream sentence endpoint failed: ${sentenceResp.status}` }, null, 2),
          {
            status: 502,
            headers: {
              "content-type": "application/json; charset=utf-8",
              "cache-control": "no-store",
            },
          }
        );
      }

      const sentenceJson: any = await sentenceResp.json();

      // Step 4: normalize BCP47 codes
      if (sentenceJson.data?.lang) {
        sentenceJson.data.bcp47 = bcp47Normalize(sentenceJson.data.lang);
        const languageInfo = Languages.find((lang => lang.lang === sentenceJson.data.lang));
        if (languageInfo) {
            sentenceJson.data.language_name = languageInfo.name;
            sentenceJson.data.language_label = languageInfo.label;
        }
      }

      if (sentenceJson.data && Array.isArray(sentenceJson.data.translations)) {
        for (const translation of sentenceJson.data.translations) {
          if (translation.lang) {
            translation.bcp47 = bcp47Normalize(translation.lang);
            const languageInfo = Languages.find((lang => lang.lang === translation.lang));
            if (languageInfo) {
                translation.language_name = languageInfo.name;
                translation.language_label = languageInfo.label;
            }
          }
        }
      }

      // Step 5: return sentenceJson as response
      return new Response(JSON.stringify(sentenceJson), {
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
