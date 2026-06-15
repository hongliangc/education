import assert from "node:assert/strict";
import test from "node:test";
// @ts-expect-error Node's native TypeScript test runner requires the explicit extension.
import { FRUIT_SHOP, buildListenChoices } from "../../content/english/scene.ts";
// @ts-expect-error Node's native TypeScript test runner requires the explicit extension.
import { matchSpokenWord } from "../../content/english/match.ts";

// The demo scene's data must be self-consistent so the five stages can render it without guards.
test("FRUIT_SHOP scene data is internally consistent", () => {
  assert.ok(FRUIT_SHOP.words.length >= 4, "needs at least four words");
  for (const w of FRUIT_SHOP.words) {
    assert.ok(w.en.length > 0, `en for ${w.id}`);
    assert.ok(w.zh.length > 0, `zh for ${w.id}`);
    assert.ok(w.emoji.length > 0, `emoji for ${w.id}`);
  }
  assert.ok(FRUIT_SHOP.pattern.includes("___"), "pattern must carry a blank for step ④");
  const childTurns = FRUIT_SHOP.dialogue.filter((t) => t.speaker === "child");
  assert.ok(childTurns.length >= 1, "role-play needs the child to speak");
  assert.ok(
    childTurns.every((t) => (t.accept?.length ?? 0) >= 1),
    "every child turn needs at least one acceptable answer",
  );
});

// Step ② (listen & find): the answer tile plus distinct distractors, all from this scene.
test("buildListenChoices returns the answer among distinct, in-scene choices", () => {
  const choices = buildListenChoices(FRUIT_SHOP, "banana", seededRng());
  assert.equal(choices.length, Math.min(4, FRUIT_SHOP.words.length));
  assert.ok(choices.some((c) => c.id === "banana"), "answer must be present");
  const ids = choices.map((c) => c.id);
  assert.equal(new Set(ids).size, ids.length, "no duplicate tiles");
  const sceneIds = new Set(FRUIT_SHOP.words.map((w) => w.id));
  assert.ok(ids.every((id) => sceneIds.has(id)), "tiles must be scene words");
});

// Data + judge agree: every scripted acceptable answer actually passes matchSpokenWord.
test("every acceptable role-play answer passes the closed-set judge", () => {
  for (const turn of FRUIT_SHOP.dialogue) {
    if (turn.speaker !== "child" || !turn.accept) continue;
    const candidates = turn.accept.map((a) => ({ id: a, en: a }));
    for (const phrase of turn.accept) {
      assert.equal(
        matchSpokenWord(phrase, candidates).matched,
        true,
        `judge should accept scripted answer "${phrase}"`,
      );
    }
  }
});

function seededRng(): () => number {
  let s = 42;
  return () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };
}
