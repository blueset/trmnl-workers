export default {
  async fetch(request: Request): Promise<Response> {
    try {
      let suffix = "";
      const searchParams = new URL(request.url).searchParams;
      if (searchParams.has("rare")) {
        suffix = "?rare";
      }

      const noSvg = searchParams.has("no-svg");
      const noPagedFont = searchParams.has("no-paged-font");

      let id = "";
      if (!searchParams.has("id")) {
        // Step 1: fetch random zis (string[])
        const zisResp = await fetch("https://zi.tools/api/random/" + suffix);
        if (!zisResp.ok) {
          return new Response(
            JSON.stringify(
              { error: `Upstream random endpoint failed: ${zisResp.status}` },
              null,
              2
            ),
            {
              status: 502,
              headers: {
                "content-type": "application/json; charset=utf-8",
                "cache-control": "no-store",
                "Access-Control-Allow-Origin": "*",
              },
            }
          );
        }
        const zis: string[] = await zisResp.json();
        if (
          !Array.isArray(zis) ||
          zis.length === 0 ||
          typeof zis[0] !== "string"
        ) {
          return new Response(
            JSON.stringify(
              { error: "Invalid response from random endpoint" },
              null,
              2
            ),
            {
              status: 502,
              headers: {
                "content-type": "application/json; charset=utf-8",
                "cache-control": "no-store",
                "Access-Control-Allow-Origin": "*",
              },
            }
          );
        }
        id = zis[0];

        if (searchParams.has("id-only")) {
          return new Response(
            JSON.stringify({ id }, null, 2),
            {
              status: 200,
              headers: {
                "content-type": "application/json; charset=utf-8",
                "cache-control": "no-store",
                "Access-Control-Allow-Origin": "*",
              },
            }
          );
        }
      } else {
        id = searchParams.get("id") || "";
      }

      // Step 2: fetch zi data by first id
      const encodedId = encodeURIComponent(id);
      const ziResp = await fetch(`https://zi.tools/api/zi/${encodedId}`);
      if (!ziResp.ok) {
        return new Response(
          JSON.stringify(
            { error: `Upstream zi endpoint failed: ${ziResp.status}` },
            null,
            2
          ),
          {
            status: 502,
            headers: {
              "content-type": "application/json; charset=utf-8",
              "cache-control": "no-store",
              "Access-Control-Allow-Origin": "*",
            },
          }
        );
      }
      const ziData = await ziResp.json();

      if (noSvg) {
        ziData.font = {};
      }

      if (!noSvg && !noPagedFont) {
        // Step 3: if font is paged, fetch and merge all font pages
        try {
          const pageCount: unknown = ziData?.font?._page_count;
          if (
            typeof pageCount === "number" &&
            Number.isInteger(pageCount) &&
            pageCount > 0
          ) {
            const pages = Array.from({ length: pageCount }, (_, i) => i + 1);
            const pagePromises = pages.map(async (page) => {
              const pageResp = await fetch(
                `https://zi.tools/api/zi/${id}_font_${page}`
              );
              if (!pageResp.ok) {
                throw new Error(
                  `Upstream font page ${page} failed: ${pageResp.status}`
                );
              }
              const pageJson: unknown = await pageResp.json();
              return pageJson as { font?: Record<string, string> };
            });

            const pageData = await Promise.all(pagePromises);
            // Merge each page's font map into ziData.font
            const baseFont: Record<string, string> =
              ziData.font && typeof ziData.font === "object"
                ? { ...ziData.font }
                : {};
            for (const data of pageData) {
              if (data && data.font && typeof data.font === "object") {
                Object.assign(baseFont, data.font);
              }
            }
            ziData.font = baseFont;
          }
        } catch (e) {
          return new Response(
            JSON.stringify(
              {
                error:
                  e instanceof Error ? e.message : "Failed to fetch font pages",
              },
              null,
              2
            ),
            {
              status: 502,
              headers: {
                "content-type": "application/json; charset=utf-8",
                "cache-control": "no-store",
                "Access-Control-Allow-Origin": "*",
              },
            }
          );
        }
      }

      // Step 4: return result
      return new Response(JSON.stringify(ziData), {
        status: 200,
        headers: {
          "content-type": "application/json; charset=utf-8",
          "cache-control": "no-store",
          "Access-Control-Allow-Origin": "*",
        },
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      return new Response(JSON.stringify({ error: message }, null, 2), {
        status: 502,
        headers: {
          "content-type": "application/json; charset=utf-8",
          "cache-control": "no-store",
          "Access-Control-Allow-Origin": "*",
        },
      });
    }
  },
};
