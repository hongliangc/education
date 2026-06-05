# TTS Natural Chunking Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Prevent story TTS chunks from splitting Chinese words while preserving the 24/60/148 character caps and exact source text.

**Architecture:** Keep `splitForTts` as the single pure chunking entry point. Add a helper that chooses the best cut at or before each dynamic cap using punctuation first, then `Intl.Segmenter`, and exact slicing only as a fallback.

**Tech Stack:** TypeScript strict mode, Node.js 24 built-in test runner, TypeScript compiler.

---

### Task 1: Add Chunking Regression Tests

**Files:**
- Create: `tests/speech/chunking.test.ts`
- Read: `lib/speech/chunking.ts`

- [x] **Step 1: Write failing word-boundary tests**

Create tests that call `splitForTts` with controlled caps and assert that:

```ts
assert.deepEqual(splitForTts("前面有一些文字天空很蓝。", 8), [
  "前面有一些文字",
  "天空很蓝。",
]);
```

Add equivalent coverage for `闷闷不乐`, `天上`, and `西天取经`. Also assert
that `chunks.join("")` equals the original text.

- [x] **Step 2: Write closing-quote and cap tests**

Cover a sentence ending in `！」` and verify the quote stays in the preceding
chunk when it fits. For every returned chunk, assert:

```ts
Array.from(chunk).length <= chunkCap(index, maxLen)
```

- [x] **Step 3: Compile and run the tests to verify RED**

Run:

```bash
rm -rf /tmp/mlk-chunking-test
npx tsc tests/speech/chunking.test.ts lib/speech/chunking.ts \
  --target ES2022 --module commonjs --moduleResolution node \
  --outDir /tmp/mlk-chunking-test --esModuleInterop --skipLibCheck
node --test /tmp/mlk-chunking-test/tests/speech/chunking.test.js
```

Expected: at least one assertion fails because the current implementation
splits at the exact character cap.

### Task 2: Implement Natural Chunk Selection

**Files:**
- Modify: `lib/speech/chunking.ts`
- Test: `tests/speech/chunking.test.ts`

- [x] **Step 1: Add boundary character groups**

Define sentence-ending, closing-quote, and clause punctuation sets. Keep them
private to the chunking module.

- [x] **Step 2: Add a best-cut helper**

Add a pure helper that receives remaining characters and a cap. It must:

1. Return the full remaining length when it fits.
2. Prefer the last sentence boundary at or before the cap, including adjacent
   closing quotes.
3. Otherwise prefer the last clause boundary at or before the cap.
4. Otherwise use the last `Intl.Segmenter("zh-CN", { granularity: "word" })`
   boundary at or before the cap.
5. Return the cap if no safer boundary exists.

- [x] **Step 3: Rewrite the long-sentence loop**

Replace exact `slice(i, i + c)` chunking with repeated calls to the best-cut
helper. Preserve all input characters and continue applying `chunkCap` based
on the number of chunks already emitted.

- [x] **Step 4: Run focused tests to verify GREEN**

Run the Task 1 compile and test commands again.

Expected: all tests pass.

### Task 3: Verify Project Compatibility

**Files:**
- Modify: `docs/superpowers/plans/2026-06-05-tts-natural-chunking.md`

- [x] **Step 1: Run TypeScript validation**

Run:

```bash
npx tsc --noEmit
```

Expected: no output and exit code 0.

- [x] **Step 2: Inspect the final diff**

Run:

```bash
git diff --check
git diff -- lib/speech/chunking.ts tests/speech/chunking.test.ts
```

Expected: no whitespace errors; changes remain limited to chunking behavior
and its tests.
