import { test } from "node:test";
import assert from "node:assert/strict";

// @ts-expect-error Node's native TypeScript runner requires the explicit extension.
import { pinyinSsml } from "../../content/hanzi/pinyin-speech.ts";

test("every simple final uses a tone-matched fallback character inside SSML", () => {
  const expected = {
    a: ["妈", "麻", "马", "骂"],
    o: ["窝", "伯", "我", "卧"],
    e: ["婀", "额", "我", "饿"],
    i: ["衣", "姨", "椅", "意"],
    u: ["乌", "无", "五", "物"],
    v: ["迂", "鱼", "雨", "玉"],
  } as const;

  for (const [base, characters] of Object.entries(expected)) {
    const results = characters.map((character, index) => {
      const ssml = pinyinSsml(base as keyof typeof expected, (index + 1) as 1 | 2 | 3 | 4);
      assert.match(ssml, new RegExp(`>${character}<`));
      return ssml;
    });
    assert.equal(new Set(results).size, 4, `${base} should produce four distinct requests`);
  }
});
