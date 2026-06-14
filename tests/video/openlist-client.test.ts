import assert from "node:assert/strict";
import test from "node:test";

// @ts-expect-error Node's native TypeScript test runner requires the explicit extension.
import { OpenListClient } from "../../lib/openlist/client-core.ts";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

test("logs in once and sends the raw OpenList token", async () => {
  const requests: Array<{ url: string; authorization: string | null }> = [];
  const fetcher: typeof fetch = async (input, init) => {
    const url = String(input);
    requests.push({
      url,
      authorization: new Headers(init?.headers).get("authorization"),
    });
    if (url.endsWith("/api/auth/login")) {
      return jsonResponse({ code: 200, data: { token: "openlist-token" } });
    }
    return jsonResponse({
      code: 200,
      data: { content: [{ name: "video.mp4", is_dir: false }], total: 1 },
    });
  };
  const client = new OpenListClient(
    {
      baseUrl: "http://openlist:5244",
      username: "video-reader",
      password: "secret",
    },
    fetcher,
  );

  await client.list("/videos");
  await client.list("/videos");

  assert.equal(requests.filter((request) => request.url.endsWith("/api/auth/login")).length, 1);
  assert.equal(requests[1]?.authorization, "openlist-token");
  assert.equal(requests[2]?.authorization, "openlist-token");
});

test("re-authenticates once when OpenList rejects the cached token", async () => {
  let loginCalls = 0;
  let listCalls = 0;
  const fetcher: typeof fetch = async (input) => {
    const url = String(input);
    if (url.endsWith("/api/auth/login")) {
      loginCalls++;
      return jsonResponse({ code: 200, data: { token: `token-${loginCalls}` } });
    }
    listCalls++;
    if (listCalls === 1) {
      return jsonResponse({ code: 401, message: "token expired" });
    }
    return jsonResponse({ code: 200, data: { content: [], total: 0 } });
  };
  const client = new OpenListClient(
    { baseUrl: "http://openlist:5244", username: "reader", password: "secret" },
    fetcher,
  );

  assert.deepEqual(await client.list("/videos"), []);
  assert.equal(loginCalls, 2);
  assert.equal(listCalls, 2);
});

test("does not include upstream response bodies in errors", async () => {
  const fetcher: typeof fetch = async () =>
    jsonResponse({ code: 500, message: "signed-url=https://secret.example/token" });
  const client = new OpenListClient(
    { baseUrl: "http://openlist:5244", username: "reader", password: "secret" },
    fetcher,
  );

  await assert.rejects(
    client.list("/videos"),
    (error: unknown) =>
      error instanceof Error &&
      error.message === "OpenList login failed" &&
      !error.message.includes("secret.example"),
  );
});
