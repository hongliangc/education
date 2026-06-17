import assert from "node:assert/strict";
import test from "node:test";

// @ts-expect-error Node's native TypeScript test runner requires the explicit extension.
import { OpenListApiError, OpenListClient } from "../../lib/openlist/client-core.ts";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function previewFetcher(taskList: Array<{ template_id?: string; status: string; url?: string }>): typeof fetch {
  return async (input) => {
    const url = String(input);
    if (url.endsWith("/api/auth/login")) {
      return jsonResponse({ code: 200, data: { token: "t" } });
    }
    return jsonResponse({
      code: 200,
      data: { video_preview_play_info: { live_transcoding_task_list: taskList } },
    });
  };
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

test("returns every finished rendition within the cap, highest quality first", async () => {
  const client = new OpenListClient(
    { baseUrl: "http://openlist:5244", username: "reader", password: "secret" },
    previewFetcher([
      { template_id: "QHD", status: "finished", url: "https://cdn/qhd.m3u8" },
      { template_id: "FHD", status: "finished", url: "https://cdn/fhd.m3u8" },
      { template_id: "HD", status: "finished", url: "https://cdn/hd.m3u8" },
      { template_id: "SD", status: "running" },
    ]),
  );

  const play = await client.getVideoPreview("/a.mp4", "FHD");

  // Capped at FHD: QHD is excluded, SD is not finished yet.
  assert.deepEqual(play.variants, [
    { quality: "FHD", url: "https://cdn/fhd.m3u8" },
    { quality: "HD", url: "https://cdn/hd.m3u8" },
  ]);
  assert.equal(play.url, "https://cdn/fhd.m3u8");
  assert.equal(play.quality, "FHD");
});

test("forwards the refresh flag so OpenList re-signs expired thumbnails", async () => {
  const bodies: Array<{ path?: string; refresh?: boolean }> = [];
  const fetcher: typeof fetch = async (input, init) => {
    const url = String(input);
    if (url.endsWith("/api/auth/login")) {
      return jsonResponse({ code: 200, data: { token: "t" } });
    }
    bodies.push(JSON.parse(String(init?.body)) as { path?: string; refresh?: boolean });
    return jsonResponse({
      code: 200,
      data: { content: [{ name: "a.mkv", is_dir: false, thumb: "https://oss/fresh.jpg" }], total: 1 },
    });
  };
  const client = new OpenListClient(
    { baseUrl: "http://openlist:5244", username: "reader", password: "secret" },
    fetcher,
  );

  await client.list("/videos");
  await client.list("/videos", true);

  // Default list is served from OpenList's cache; the refresh:true call forces a
  // fresh upstream re-sign so the thumbnail URL is not already expired.
  assert.equal(bodies[0]?.refresh, false);
  assert.equal(bodies[1]?.refresh, true);
  assert.equal(bodies[1]?.path, "/videos");
});

test("reports a permanent transcode failure as 422, not an endless preparing state", async () => {
  const client = new OpenListClient(
    { baseUrl: "http://openlist:5244", username: "reader", password: "secret" },
    previewFetcher([
      { template_id: "FHD", status: "failed" },
      { template_id: "SD", status: "failed" },
    ]),
  );

  await assert.rejects(
    client.getVideoPreview("/a.mp4"),
    (error: unknown) => error instanceof OpenListApiError && error.status === 422,
  );
});

test("stays in the preparing state (202) while any transcode task is still running", async () => {
  const client = new OpenListClient(
    { baseUrl: "http://openlist:5244", username: "reader", password: "secret" },
    previewFetcher([
      { template_id: "FHD", status: "running" },
      { template_id: "SD", status: "failed" },
    ]),
  );

  await assert.rejects(
    client.getVideoPreview("/a.mp4"),
    (error: unknown) => error instanceof OpenListApiError && error.status === 202,
  );
});
