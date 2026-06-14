import assert from "node:assert/strict";
import test from "node:test";

// @ts-expect-error Node's native TypeScript test runner requires the explicit extension.
import { parseOpenListCatalog } from "../../lib/video/openlist-catalog.ts";

test("uses stable catalog ids while resolving source paths inside the video root", () => {
  const catalog = parseOpenListCatalog(
    JSON.stringify({
      version: 1,
      videos: [
        {
          id: "perfect-planet-s01e02",
          path: "A.Perfect.Planet.S01E02.mp4",
          poster: "A.Perfect.Planet.S01E02.jpg",
          title: "阳光",
          order: 2,
          cost: 12,
        },
      ],
    }),
    "/videos",
    new Set(["A.Perfect.Planet.S01E02.mp4", "A.Perfect.Planet.S01E02.jpg"]),
  );

  assert.equal(catalog[0]?.id, "perfect-planet-s01e02");
  assert.equal(catalog[0]?.sourcePath, "/videos/A.Perfect.Planet.S01E02.mp4");
  assert.equal(catalog[0]?.posterPath, "/videos/A.Perfect.Planet.S01E02.jpg");
  assert.equal(catalog[0]?.posterUrl, "/api/videos/perfect-planet-s01e02/poster");
});

test("supports a least-privilege OpenList user whose base path is the video folder", () => {
  const catalog = parseOpenListCatalog(
    JSON.stringify({
      version: 1,
      videos: [{ id: "root-video", path: "video.mp4", title: "Root Video" }],
    }),
    "/",
    new Set(["video.mp4"]),
  );

  assert.equal(catalog[0]?.sourcePath, "/video.mp4");
});

test("rejects duplicate stable ids", () => {
  const input = JSON.stringify({
    version: 1,
    videos: [
      { id: "same-id", path: "one.mp4", title: "One" },
      { id: "same-id", path: "two.mp4", title: "Two" },
    ],
  });

  assert.throws(
    () => parseOpenListCatalog(input, "/videos", new Set(["one.mp4", "two.mp4"])),
    /duplicate video id/,
  );
});

test("rejects paths that escape the configured root", () => {
  const input = JSON.stringify({
    version: 1,
    videos: [{ id: "unsafe", path: "../private.mp4", title: "Unsafe" }],
  });

  assert.throws(
    () => parseOpenListCatalog(input, "/videos", new Set(["private.mp4"])),
    /must stay inside the video root/,
  );
});

test("rejects catalog entries whose source file is missing", () => {
  const input = JSON.stringify({
    version: 1,
    videos: [{ id: "missing", path: "missing.mp4", title: "Missing" }],
  });

  assert.throws(
    () => parseOpenListCatalog(input, "/videos", new Set()),
    /source file does not exist/,
  );
});
