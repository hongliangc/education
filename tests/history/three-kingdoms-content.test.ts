// tests/history/three-kingdoms-content.test.ts
import assert from "node:assert/strict";
import test from "node:test";
// @ts-expect-error Node's native TypeScript test runner requires the explicit extension.
import { THREE_KINGDOMS } from "../../content/storybooks/three-kingdoms.ts";

test("三国是一本 10 章 novel，idx 顺序 0-9", () => {
  assert.equal(THREE_KINGDOMS.id, "three-kingdoms");
  assert.equal(THREE_KINGDOMS.kind, "novel");
  assert.equal(THREE_KINGDOMS.chapters.length, 10);
  THREE_KINGDOMS.chapters.forEach((c, i) => assert.equal(c.idx, i));
});

test("每章有正文、2-3 题且答案下标合法、有演义/史实对照与人物卡", () => {
  for (const c of THREE_KINGDOMS.chapters) {
    assert.ok(c.text.trim().length > 0, `${c.title} 正文非空`);
    assert.ok(c.questions.length >= 2 && c.questions.length <= 3, `${c.title} 2-3 题`);
    for (const q of c.questions) {
      assert.ok(q.answer >= 0 && q.answer < q.choices.length, `${c.title} 答案下标合法`);
    }
    assert.ok(c.historyNote && c.historyNote.romance && c.historyNote.history, `${c.title} 有对照`);
    assert.ok(Array.isArray(c.cardKeys) && c.cardKeys.length > 0, `${c.title} 有人物卡`);
  }
});
