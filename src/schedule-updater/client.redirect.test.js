import { createServer } from "node:http";
import { expect, it } from "vitest";
import { TrmnlClient } from "./client";

it("rejects redirects without forwarding credentials, including schedule writes", async () => {
  let redirectedRequests = 0;
  const server = createServer((request, response) => {
    if (request.url === "/redirect") {
      response.writeHead(302, { Location: "/destination" }).end();
    } else {
      redirectedRequests++;
      response.writeHead(200).end("{}");
    }
  });
  await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
  try {
    const address = server.address();
    if (!address || typeof address === "string") throw new Error("Missing test server address");
    const request = (_url, init) => fetch(`http://127.0.0.1:${address.port}/redirect`, init);
    const client = new TrmnlClient("secret", request);
    await expect(client.calendar("123")).rejects.toMatchObject({
      operation: "calendar_get", code: "upstream_http_error", status: 302,
    });
    await expect(client.replaceSchedule("456", [
      { week_days: [1], start_time: "09:45", end_time: "10:15" },
    ])).rejects.toMatchObject({
      operation: "schedule_put", code: "upstream_http_error", status: 302,
    });
    expect(redirectedRequests).toBe(0);
  } finally {
    await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
  }
});
