import codepoints from "./codepoints";
import mdn from "./mdn";
import ziTools from "./zi-tools";
import googleFonts from "./google-fonts";
import tatoeba from "./tatoeba";
import slickdeals from "./slickdeals";

interface Env {
  TRMNL_WORKERS_KV: KVNamespace;
  GITHUB_TOKEN?: string;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === "GET" && url.pathname === "/codepoints") {
        return codepoints.fetch(request, env);
    } else if (request.method === "GET" && url.pathname === "/mdn") {
        return mdn.fetch(request);
    } else if (request.method === "GET" && url.pathname === "/zi-tools") {
        return ziTools.fetch(request);
    } else if (request.method === "GET" && url.pathname === "/tatoeba") {
        return tatoeba.fetch(request);
    } else if (request.method === "GET" && url.pathname === "/slickdeals") {
        return slickdeals.fetch(request);
    }

    return new Response("Not Found", { status: 404 });
  },
};
