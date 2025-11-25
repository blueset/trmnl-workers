import Base92 from "base92";

async function gzipCompress(data: Uint8Array): Promise<Uint8Array> {
  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(data);
      controller.close();
    },
  }).pipeThrough(new CompressionStream("gzip"));

  const chunks: Uint8Array[] = [];
  const reader = stream.getReader();
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
  }
  const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.length;
  }
  return result;
}

async function buildResponse({ data, status = 200, compress = false }: { data: unknown; status?: number; compress?: boolean }): Promise<Response> {
  let payload = JSON.stringify(data);

  if (compress) {
    const compressed = await gzipCompress(new TextEncoder().encode(payload));
    const base92 = new Base92();
    const base92Encoded = base92.encode(compressed);
    payload = JSON.stringify(base92Encoded);
  }

  return new Response(payload, {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      "Access-Control-Allow-Origin": "*",
    },
  });
}

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
      const compress = searchParams.has("compress");

      let id = "";
      if (!searchParams.has("id")) {
        // Step 1: fetch random zis (string[])
        const zisResp = await fetch("https://zi.tools/api/random/" + suffix);
        if (!zisResp.ok) {
          return buildResponse({
            data: { error: `Upstream random endpoint failed: ${zisResp.status}` },
            status: 502,
          });
        }
        const zis: string[] = await zisResp.json();
        if (
          !Array.isArray(zis) ||
          zis.length === 0 ||
          typeof zis[0] !== "string"
        ) {
          return buildResponse({
            data: { error: "Invalid response from random endpoint" },
            status: 502,
          });
        }
        id = zis[0];

        if (searchParams.has("id-only")) {
          return buildResponse({ data: { id } });
        }
      } else {
        id = searchParams.get("id") || "";
      }

      // Step 2: fetch zi data by first id
      const encodedId = encodeURIComponent(id);
      const ziResp = await fetch(`https://zi.tools/api/zi/${encodedId}`);
      if (!ziResp.ok) {
        return buildResponse({
          data: { error: `Upstream zi endpoint failed: ${ziResp.status}` },
          status: 502,
        });
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
          return buildResponse({
            data: {
              error: e instanceof Error ? e.message : "Failed to fetch font pages",
            },
            status: 502,
          });
        }
      }

      // Step 4: return result
      return buildResponse({ data: ziData, compress });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      return buildResponse({ data: { error: message }, status: 502 });
    }
  },
};
