export default {
  async fetch(request: Request): Promise<Response> {
    try {
      // Step 1: fetch random zis (string[])
      const zisResp = await fetch("https://zi.tools/api/random/");
      if (!zisResp.ok) {
        return new Response(
          JSON.stringify({ error: `Upstream random endpoint failed: ${zisResp.status}` }, null, 2),
          {
            status: 502,
            headers: {
              "content-type": "application/json; charset=utf-8",
              "cache-control": "no-store",
            },
          }
        );
      }
      const zis: string[] = await zisResp.json();
      if (!Array.isArray(zis) || zis.length === 0 || typeof zis[0] !== "string") {
        return new Response(
          JSON.stringify({ error: "Invalid response from random endpoint" }, null, 2),
          {
            status: 502,
            headers: {
              "content-type": "application/json; charset=utf-8",
              "cache-control": "no-store",
            },
          }
        );
      }

      // Step 2: fetch zi data by first id
      const id = encodeURIComponent(zis[0]);
      const ziResp = await fetch(`https://zi.tools/api/zi/${id}`);
      if (!ziResp.ok) {
        return new Response(
          JSON.stringify({ error: `Upstream zi endpoint failed: ${ziResp.status}` }, null, 2),
          {
            status: 502,
            headers: {
              "content-type": "application/json; charset=utf-8",
              "cache-control": "no-store",
            },
          }
        );
      }
      const ziData = await ziResp.json();

      // Step 3: if font is paged, fetch and merge all font pages
      try {
        const pageCount: unknown = ziData?.font?._page_count;
        if (typeof pageCount === "number" && Number.isInteger(pageCount) && pageCount > 0) {
          const pages = Array.from({ length: pageCount }, (_, i) => i + 1);
          const pagePromises = pages.map(async (page) => {
            const pageResp = await fetch(`https://zi.tools/api/zi/${id}_font_${page}`);
            if (!pageResp.ok) {
              throw new Error(`Upstream font page ${page} failed: ${pageResp.status}`);
            }
            const pageJson: unknown = await pageResp.json();
            return pageJson as { font?: Record<string, string> };
          });

          const pageData = await Promise.all(pagePromises);
          // Merge each page's font map into ziData.font
          const baseFont: Record<string, string> = (ziData.font && typeof ziData.font === "object") ? { ...ziData.font } : {};
          for (const data of pageData) {
            if (data && data.font && typeof data.font === "object") {
              Object.assign(baseFont, data.font);
            }
          }
          ziData.font = baseFont;
        }
      } catch (e) {
        return new Response(
          JSON.stringify({ error: e instanceof Error ? e.message : "Failed to fetch font pages" }, null, 2),
          {
            status: 502,
            headers: {
              "content-type": "application/json; charset=utf-8",
              "cache-control": "no-store",
            },
          }
        );
      }

      // Step 4: return result
      return new Response(JSON.stringify(ziData), {
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
