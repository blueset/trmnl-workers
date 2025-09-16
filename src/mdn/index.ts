import { randomMDN } from "./utils";

export default {
    async fetch(request: Request): Promise<Response> {
        const article = await randomMDN();
        return new Response(JSON.stringify(article), {
            headers: { "Content-Type": "application/json" },
        });
    },
};