import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

// 回归：流式朗读（小精灵单条流式、数学讲解）在 iOS 上的实时性与播放元素。
// 见 bugfix/2026-06-21-fairy-uncached-chunk-gap.md。

test("speakTextStream plays through the pre-unlocked shared element, not a fresh new Audio()", async () => {
  const source = await readFile(new URL("../../lib/speech.ts", import.meta.url), "utf8");

  // MSE 路径把 objectURL 设给手势内已解锁的共享元素，iOS 上可直接编程 play。
  assert.match(source, /attach\(prepShared\(objUrl\)\)/);
  // 不得再用脱离手势新建的元素播放流式音频（iOS 会拦）。
  assert.doesNotMatch(source, /attach\(new Audio\(objUrl\)\)/);
});

test("speakTextStream uses native progressive playback (not full-blob download) when MSE is absent", async () => {
  const source = await readFile(new URL("../../lib/speech.ts", import.meta.url), "utf8");

  // iPhone Safari 无 MediaSource：必须原生边下边播流式端点（首声快、整段无 gap），
  // 并带 pad=1 让服务端补静音尾巴抵消 Safari 掐尾——而不是 await blob 整段下完再播（首句严重延迟）。
  assert.match(source, /if \(!canMse\)/);
  assert.match(source, /&pad=1/);
});

test("tts-stream server appends a silent MP3 tail only when pad is requested", async () => {
  const source = await readFile(
    new URL("../../lib/speech/server/stream.ts", import.meta.url),
    "utf8",
  );

  // 静音尾巴：MPEG-2 LIII 16kHz 帧头 (FF F3 48 C0) + 全 0，按需追加，不写缓存。
  assert.match(source, /SILENCE_MP3/);
  assert.match(source, /0xf3/);
  assert.match(source, /0xc0/);
  // 仅在 pad 请求时追加，且不进 parts（不污染缓存）。
  assert.match(source, /opts\.pad && !closed/);
  assert.match(source, /enqueue\(new Uint8Array\(SILENCE_MP3\)\)/);
});

test("tts-stream server strips emoji before synthesis (avoids Tencent code 20002 / broken caching)", async () => {
  // 见 bugfix/2026-06-22-fairy-tts-emoji-ssml-invalid.md：精灵回复带 emoji → 腾讯 SSMLInvalid(20002)
  // → final 不下发 → 缓存从不落盘、流以错误收尾。合成前净化，缓存键仍用原始 text。
  const source = await readFile(
    new URL("../../lib/speech/server/stream.ts", import.meta.url),
    "utf8",
  );

  assert.match(source, /function sanitizeForTts\(/);
  assert.match(source, /\\p\{Extended_Pictographic\}/);
  // 送腾讯合成的是净化后的 ttsText，而不是原始带 emoji 的 text。
  assert.match(source, /const ttsText = sanitizeForTts\(text\)/);
  assert.match(source, /action: "ACTION_SYNTHESIS",\s*data: ttsText,/);
  // 缓存键仍基于原始 text（读写一致）。
  assert.match(source, /ttsCacheKey\(text, String\(voice\), lang\)/);
});

test("tts-stream route forwards the pad flag to the synthesizer", async () => {
  const source = await readFile(
    new URL("../../app/api/speech/tts-stream/route.ts", import.meta.url),
    "utf8",
  );

  assert.match(source, /pad = searchParams\.get\("pad"\) === "1"/);
  assert.match(source, /synthesizeStream\(text, \{ lang, voice, pad, tag \}\)/);
});

test("tts-stream server warms the iOS pipeline with lead-in silence, only when pad is requested", async () => {
  // 见 bugfix/2026-06-22-fairy-ios-first-segment-latency.md：iPhone 首段慢 = 腾讯首帧硬地板
  // + iOS 原生 <audio> 冷启动缓冲。pad=1 时从 ready 起下发前导静音喂活管线、真实首帧到达即停。
  const source = await readFile(
    new URL("../../lib/speech/server/stream.ts", import.meta.url),
    "utf8",
  );

  // 前导静音与尾部静音复用同一套静音帧生成器（帧头 FF F3 48 C0）。
  assert.match(source, /function silentFrames\(/);
  assert.match(source, /const LEAD_IN_CHUNK = silentFrames\(/);
  // 仅 pad（iOS 原生边下边播）路径、首帧前、ready 之后才下发前导静音，且不进 parts（不污染缓存）。
  assert.match(source, /opts\.pad && !leadIn && !firstReal/);
  assert.match(source, /controller\.enqueue\(new Uint8Array\(LEAD_IN_CHUNK\)\)/);
  // 真实首帧一到即停掉前导静音（真声之间绝不夹静音）。
  assert.match(source, /firstReal = true;\s+stopLeadIn\(\);/);
  // 客户端断开时清掉定时器，避免泄漏。
  assert.match(source, /cancel\(\)[\s\S]*?stopLeadIn\(\);/);
});
