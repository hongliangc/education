import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
// @ts-expect-error Node's native TypeScript test runner requires the explicit extension.
import { voiceMatchesLang, DEFAULT_VOICE_EN, DEFAULT_VOICE_ZH } from "../../lib/speech/voices.ts";

const ZH_VOICE = 601009; // 爱小芊 (zh)
const EN_VOICE = 501009; // WeWinny (en) === DEFAULT_VOICE_EN

test("voiceMatchesLang gates voices by language", () => {
  // A Chinese voice must NOT be accepted for English (the prod bug: 中文音色念英文).
  assert.equal(voiceMatchesLang(ZH_VOICE, "en-US"), false);
  assert.equal(voiceMatchesLang(EN_VOICE, "en-US"), true);
  // …and an English voice must not be used for Chinese.
  assert.equal(voiceMatchesLang(EN_VOICE, "zh-CN"), false);
  assert.equal(voiceMatchesLang(ZH_VOICE, "zh-CN"), true);
  // Unknown voice ids never match.
  assert.equal(voiceMatchesLang(999999, "en-US"), false);
  // Sanity: defaults are language-appropriate.
  assert.equal(voiceMatchesLang(DEFAULT_VOICE_EN, "en-US"), true);
  assert.equal(voiceMatchesLang(DEFAULT_VOICE_ZH, "zh-CN"), true);
});

test("voice resolution call sites gate the chosen voice on language", () => {
  const client = readFileSync("lib/speech.ts", "utf8");
  const rest = readFileSync("lib/speech/server/tts.ts", "utf8");
  const stream = readFileSync("lib/speech/server/stream.ts", "utf8");
  // Client: both explicit voice and the saved pref must pass voiceMatchesLang.
  assert.match(client, /explicit && voiceMatchesLang\(explicit, lang\)/);
  assert.match(client, /pref && voiceMatchesLang\(pref, lang\)/);
  // Server (authoritative): REST + stream both gate on voiceMatchesLang.
  assert.match(rest, /voiceMatchesLang\(opts\.voice, lang\)/);
  assert.match(stream, /voiceMatchesLang\(voice, lang/);
});
