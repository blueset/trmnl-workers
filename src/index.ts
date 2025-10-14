import codepoints from "./codepoints";
import mdn from "./mdn";
import ziTools from "./zi-tools";
import googleFonts from "./google-fonts";

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
    } /* else if (request.method === "GET" && url.pathname === "/google-fonts") {
        return googleFonts.fetch(request, env);
    } */

    return new Response("Not Found", { status: 404 });
  },
};
