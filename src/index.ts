import codepoints from "./codepoints";
import mdn from "./mdn";
import ziTools from "./zi-tools";

export default {
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === "GET" && url.pathname === "/codepoints") {
        return codepoints.fetch(request);
    } else if (request.method === "GET" && url.pathname === "/mdn") {
        return mdn.fetch(request);
    } else if (request.method === "GET" && url.pathname === "/zi-tools") {
        return ziTools.fetch(request);
    }

    return new Response("Not Found", { status: 404 });
  },
};
