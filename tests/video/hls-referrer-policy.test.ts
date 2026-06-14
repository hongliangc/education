import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

// @ts-expect-error Node's native TypeScript test runner requires the explicit extension.
import { createNoReferrerHlsRequest } from "../../lib/video/hls-request.ts";

test("hls.js requests suppress the page Referer", () => {
  const request = createNoReferrerHlsRequest(
    "https://video-preview-v6.aliyundrive.cloud/playlist.m3u8",
    {
      method: "GET",
      headers: { range: "bytes=0-1023" },
      referrer: "http://localhost:3001/theater",
    },
  );

  assert.equal(request.referrerPolicy, "no-referrer");
  assert.equal(request.referrer, "");
  assert.equal(request.headers.get("range"), "bytes=0-1023");
});

test("native HLS suppresses the page Referer before assigning the source", async () => {
  const source = await readFile(
    new URL("../../components/video/VideoPlayer.tsx", import.meta.url),
    "utf8",
  );

  const policyIndex = source.indexOf(
    'video.setAttribute("referrerpolicy", "no-referrer")',
  );
  const sourceIndex = source.indexOf("video.src = src");
  assert.ok(policyIndex >= 0, "native HLS video is missing the no-referrer policy");
  assert.ok(policyIndex < sourceIndex, "referrer policy must be set before loading the source");
});
