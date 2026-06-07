import assert from "node:assert/strict";
import test from "node:test";
// @ts-expect-error Node's native TypeScript test runner requires the explicit extension.
import { buildRecognitionOptions } from "../../lib/speech/server/stt-options.ts";

test("adds product vocabulary to Chinese recognition requests", () => {
  assert.deepEqual(buildRecognitionOptions({ lang: "zh-CN", format: "wav" }), {
    EngSerViceType: "16k_zh",
    VoiceFormat: "wav",
    HotwordList: "小精灵|11,魔法学习王国|10,星星|5",
  });
});

test("does not send Chinese hotwords to English recognition", () => {
  assert.deepEqual(buildRecognitionOptions({ lang: "en-US", format: "wav" }), {
    EngSerViceType: "16k_en",
    VoiceFormat: "wav",
  });
});
