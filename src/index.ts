import codepoints from "./codepoints";
import mdn from "./mdn";
import ziTools from "./zi-tools";
import tatoeba from "./tatoeba";
import slickdeals from "./slickdeals";
import transit from "./transit";
import uspto from "./uspto";
import { scheduled } from "./schedule-updater";

type Env = Omit<WorkerBindings, "GITHUB_TOKEN" | "TRMNL_API_KEY"> &
  Partial<Pick<WorkerBindings, "GITHUB_TOKEN" | "TRMNL_API_KEY">>;

export default {
  scheduled,
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
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
        return slickdeals.fetch(request, env, ctx);
    } else if (request.method === "GET" && url.pathname === "/transit") {
        return transit.fetch(request);
      } else if (request.method === "GET" && url.pathname === "/uspto") {
        return uspto.fetch(request, env, ctx);
    }

    return new Response("Not Found", { status: 404 });
  },
} satisfies ExportedHandler<Env>;
