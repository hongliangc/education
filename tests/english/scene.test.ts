import assert from "node:assert/strict";
import test from "node:test";
// @ts-expect-error Node's native TypeScript test runner requires the explicit extension.
import { ENGLISH_SCENES, buildListenChoices } from "../../content/english/scene.ts";
// @ts-expect-error Node's native TypeScript test runner requires the explicit extension.
import { matchSpokenWord } from "../../content/english/match.ts";

// Every scene's data must be self-consistent so the five stages can render it without guards.
test("every scene's data is internally consistent", () => {
  assert.ok(ENGLISH_SCENES.length >= 1, "needs at least one scene");
  for (const scene of ENGLISH_SCENES) {
    assert.ok(scene.icon.trim().length > 0, `icon for ${scene.id}`);
    assert.ok(scene.title.length > 0, `title for ${scene.id}`);
    assert.ok(scene.words.length >= 4, `${scene.id} needs at least four words`);
    for (const w of scene.words) {
      assert.ok(w.en.length > 0, `en for ${scene.id}/${w.id}`);
      assert.ok(w.zh.length > 0, `zh for ${scene.id}/${w.id}`);
      assert.ok(w.emoji.length > 0, `emoji for ${scene.id}/${w.id}`);
    }
    assert.ok(scene.pattern.includes("___"), `${scene.id} pattern must carry a blank for step ④`);
    const childTurns = scene.dialogue.filter((t) => t.speaker === "child");
    assert.ok(childTurns.length >= 1, `${scene.id} role-play needs the child to speak`);
    assert.ok(
      childTurns.every((t) => (t.accept?.length ?? 0) >= 1),
      `${scene.id}: every child turn needs at least one acceptable answer`,
    );
  }
});

// Scene ids stay unique so the picker can key on them.
test("scene ids are unique", () => {
  const ids = ENGLISH_SCENES.map((s) => s.id);
  assert.equal(new Set(ids).size, ids.length, "duplicate scene id");
});

// Step ② (listen & find): the answer tile plus distinct distractors, all from this scene.
test("buildListenChoices returns the answer among distinct, in-scene choices", () => {
  for (const scene of ENGLISH_SCENES) {
    const answerId = scene.words[0].id;
    const choices = buildListenChoices(scene, answerId, seededRng());
    assert.equal(choices.length, Math.min(4, scene.words.length), `count for ${scene.id}`);
    assert.ok(choices.some((c) => c.id === answerId), `${scene.id}: answer must be present`);
    const ids = choices.map((c) => c.id);
    assert.equal(new Set(ids).size, ids.length, `${scene.id}: no duplicate tiles`);
    const sceneIds = new Set(scene.words.map((w) => w.id));
    assert.ok(ids.every((id) => sceneIds.has(id)), `${scene.id}: tiles must be scene words`);
  }
});

// Data + judge agree: every scripted acceptable answer actually passes matchSpokenWord.
test("every acceptable role-play answer passes the closed-set judge", () => {
  for (const scene of ENGLISH_SCENES) {
    for (const turn of scene.dialogue) {
      if (turn.speaker !== "child" || !turn.accept) continue;
      const candidates = turn.accept.map((a) => ({ id: a, en: a }));
      for (const phrase of turn.accept) {
        assert.equal(
          matchSpokenWord(phrase, candidates).matched,
          true,
          `${scene.id}: judge should accept scripted answer "${phrase}"`,
        );
      }
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
