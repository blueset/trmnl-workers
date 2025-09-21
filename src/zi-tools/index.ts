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

      // Step 3: return as-is
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
