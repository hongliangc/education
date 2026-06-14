import assert from "node:assert/strict";
import test from "node:test";

import {
  isOriginAllowed,
  normalizeBaseUrl,
  parsePlaylistSegments,
  selectPreviewTask,
} from "../scripts/lib/openlist-video-preflight.mjs";

test("normalizeBaseUrl removes trailing slashes", () => {
  assert.equal(normalizeBaseUrl("https://openlist.example.com///"), "https://openlist.example.com");
});

test("normalizeBaseUrl rejects embedded credentials", () => {
  assert.throws(
    () => normalizeBaseUrl("https://user:pass@openlist.example.com"),
    /must not contain credentials/,
  );
});

test("selectPreviewTask chooses the highest finished quality within the cap", () => {
  const preview = {
    video_preview_play_info: {
      live_transcoding_task_list: [
        { template_id: "QHD", status: "finished", url: "https://media.test/qhd.m3u8" },
        { template_id: "FHD", status: "finished", url: "https://media.test/fhd.m3u8" },
        { template_id: "HD", status: "finished", url: "https://media.test/hd.m3u8" },
      ],
    },
  };

  assert.deepEqual(selectPreviewTask(preview, "FHD"), {
    templateId: "FHD",
    status: "finished",
    url: "https://media.test/fhd.m3u8",
  });
});

test("selectPreviewTask ignores tasks without playable URLs", () => {
  const preview = {
    video_preview_play_info: {
      live_transcoding_task_list: [
        { template_id: "FHD", status: "finished", url: "" },
        { template_id: "HD", status: "finished", url: "https://media.test/hd.m3u8" },
      ],
    },
  };

  assert.equal(selectPreviewTask(preview, "FHD")?.templateId, "HD");
});

test("parsePlaylistSegments resolves relative segment paths", () => {
  const playlist = [
    "#EXTM3U",
    "#EXTINF:10,",
    "media-0.ts?token=secret",
    "#EXTINF:10,",
    "https://cdn.test/media-1.ts?token=secret",
  ].join("\n");

  assert.deepEqual(
    parsePlaylistSegments(playlist, "https://media.test/FHD/index.m3u8?auth=signed"),
    [
      "https://media.test/FHD/media-0.ts?token=secret",
      "https://cdn.test/media-1.ts?token=secret",
    ],
  );
});

test("isOriginAllowed accepts wildcard and exact origin", () => {
  assert.equal(isOriginAllowed("*", "https://app.example.com"), true);
  assert.equal(
    isOriginAllowed("https://app.example.com", "https://app.example.com"),
    true,
  );
  assert.equal(
    isOriginAllowed("https://other.example.com", "https://app.example.com"),
    false,
  );
});
