import assert from "node:assert/strict";
import test from "node:test";

// @ts-expect-error Node's native TypeScript test runner requires the explicit extension.
import { buildVideoCatalog, cleanTitle, deriveVideoId } from "../../lib/video/openlist-catalog.ts";

test("cleanTitle strips scene-release junk but keeps SxxExx and years", () => {
  assert.equal(
    cleanTitle("The.Green.Planet.S01E02.2160p.BluRay.x265.DTS-HD.MA.5.1.mkv"),
    "The Green Planet S01E02",
  );
  assert.equal(
    cleanTitle("The.Boy.and.the.Heron.2023.1080p.iT.WEB-DL.mp4"),
    "The Boy and the Heron 2023",
  );
});

test("cleanTitle drops bracketed tags and trailing Chinese quality suffixes", () => {
  assert.equal(cleanTitle("兔小贝成语故事 第04集-蓝光4k.mp4"), "兔小贝成语故事 第04集");
  assert.equal(cleanTitle("81.仙履奇缘国语【萌娃资源】.mkv"), "81.仙履奇缘国语");
});

test("cleanTitle leaves an already-clean name untouched and never empties out", () => {
  assert.equal(cleanTitle("冰雪奇缘.mp4"), "冰雪奇缘");
  assert.equal(cleanTitle("小猪佩奇 第13集.mp4"), "小猪佩奇 第13集");
  assert.equal(cleanTitle("【全集】.mp4"), "【全集】"); // would empty out → falls back to basename
});

test("derives stable, regex-safe ids from the path relative to the video root", () => {
  const id = deriveVideoId("动画/冰雪奇缘.mp4");
  assert.match(id, /^[a-z0-9][a-z0-9._-]{0,127}$/);
  assert.equal(id.length, 16);
  assert.equal(id, deriveVideoId("动画/冰雪奇缘.mp4")); // stable across calls
  assert.notEqual(id, deriveVideoId("英语/冰雪奇缘.mp4")); // path-sensitive
});

test("builds categories from folder listings with default order, title, cost and poster pairing", () => {
  const catalog = buildVideoCatalog("/videos", [
    {
      category: "动画",
      files: [
        { name: "冰雪奇缘.mp4", isDir: false, thumb: "https://thumb/frozen" },
        { name: "冰雪奇缘.jpg", isDir: false },
      ],
    },
    {
      category: "英语",
      files: [{ name: "Hello.mp4", isDir: false }],
    },
  ]);

  assert.equal(catalog.length, 2);

  const frozen = catalog.find((video) => video.title === "冰雪奇缘");
  assert.ok(frozen);
  assert.equal(frozen.category, "动画");
  assert.equal(frozen.categoryTitle, "动画");
  assert.equal(frozen.categoryOrder, 1); // 动画 sorts before 英语 (zh-CN)
  assert.equal(frozen.cost, 20); // VIDEO_DEFAULT_COST fallback
  assert.equal(frozen.sourcePath, "/videos/动画/冰雪奇缘.mp4");
  assert.equal(frozen.posterPath, "/videos/动画/冰雪奇缘.jpg");
  assert.equal(frozen.thumbUrl, "https://thumb/frozen");
  assert.equal(frozen.id, deriveVideoId("动画/冰雪奇缘.mp4"));

  const hello = catalog.find((video) => video.title === "Hello");
  assert.ok(hello);
  assert.equal(hello.categoryOrder, 2);
  assert.equal(hello.posterPath, undefined);
  assert.equal(hello.thumbUrl, undefined);
});

test("orders numbered episodes naturally even when the upstream listing is shuffled", () => {
  const catalog = buildVideoCatalog("/videos", [
    {
      category: "三国演义",
      files: [
        { name: "三国演义 第10集.mp4", isDir: false },
        { name: "三国演义 第2集.mp4", isDir: false },
        { name: "三国演义 第1集.mp4", isDir: false },
      ],
    },
  ]);

  assert.deepEqual(
    catalog.map((video) => video.title),
    ["三国演义 第1集", "三国演义 第2集", "三国演义 第10集"],
  );
  assert.deepEqual(
    catalog.map((video) => video.order),
    [1, 2, 3],
  );
});

test("orders leading-number Chinese episode filenames naturally", () => {
  const catalog = buildVideoCatalog("/videos", [
    {
      category: "三国演义94版.D修复全网最清445G",
      files: [
        { name: "20孙策之死.mkv", isDir: false },
        { name: "78诈病赚曹爽.mkv", isDir: false },
        { name: "05三英战吕布.mkv", isDir: false },
        { name: "01桃园三结义.mkv", isDir: false },
        { name: "02十常侍乱政.mkv", isDir: false },
      ],
    },
  ]);

  assert.deepEqual(
    catalog.map((video) => video.title),
    ["01桃园三结义", "02十常侍乱政", "05三英战吕布", "20孙策之死", "78诈病赚曹爽"],
  );
  assert.deepEqual(
    catalog.map((video) => video.order),
    [1, 2, 3, 4, 5],
  );
});

test("supports a video-root mount whose categories sit at the root", () => {
  const catalog = buildVideoCatalog("/", [
    { category: "科普", files: [{ name: "宇宙.mp4", isDir: false }] },
  ]);
  assert.equal(catalog[0]?.sourcePath, "/科普/宇宙.mp4");
});

test("ignores subfolders and non-media files inside a category", () => {
  const catalog = buildVideoCatalog("/videos", [
    {
      category: "动画",
      files: [
        { name: "剧集", isDir: true },
        { name: "readme.txt", isDir: false },
        { name: "ok.mp4", isDir: false },
      ],
    },
  ]);
  assert.equal(catalog.length, 1);
  assert.equal(catalog[0]?.title, "ok");
});

test("applies catalog.json overrides for category and video metadata", () => {
  const catalog = buildVideoCatalog(
    "/videos",
    [
      {
        category: "动画",
        files: [
          { name: "a.mp4", isDir: false },
          { name: "b.mp4", isDir: false },
          { name: "cover.jpg", isDir: false },
        ],
      },
    ],
    JSON.stringify({
      version: 1,
      categories: { 动画: { title: "动画乐园", order: 5 } },
      videos: {
        "动画/a.mp4": { id: "frozen", title: "冰雪奇缘", cost: 30, order: 1, poster: "动画/cover.jpg" },
      },
    }),
  );

  const frozen = catalog.find((video) => video.id === "frozen");
  assert.ok(frozen);
  assert.equal(frozen.title, "冰雪奇缘");
  assert.equal(frozen.cost, 30);
  assert.equal(frozen.categoryTitle, "动画乐园");
  assert.equal(frozen.categoryOrder, 5);
  assert.equal(frozen.posterPath, "/videos/动画/cover.jpg");
});

test("rejects duplicate ids, missing override targets, and the legacy array schema", () => {
  const listing = [
    { category: "动画", files: [{ name: "a.mp4", isDir: false }, { name: "b.mp4", isDir: false }] },
  ];

  assert.throws(
    () =>
      buildVideoCatalog(
        "/videos",
        listing,
        JSON.stringify({ version: 1, videos: { "动画/a.mp4": { id: "dup" }, "动画/b.mp4": { id: "dup" } } }),
      ),
    /duplicate video id/,
  );

  assert.throws(
    () =>
      buildVideoCatalog(
        "/videos",
        listing,
        JSON.stringify({ version: 1, videos: { "动画/missing.mp4": { title: "x" } } }),
      ),
    /missing file/,
  );

  assert.throws(
    () => buildVideoCatalog("/videos", listing, JSON.stringify({ version: 1, videos: [] })),
    /keyed by/,
  );

  assert.throws(
    () => buildVideoCatalog("/videos", listing, "not json"),
    /not valid JSON/,
  );

  assert.throws(
    () => buildVideoCatalog("/videos", listing, JSON.stringify({ version: 2 })),
    /version 1/,
  );
});
