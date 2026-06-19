import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

test("literature home exposes the shared return control back to the world", () => {
  const source = readFileSync("app/(game)/literature/page.tsx", "utf8");

  assert.match(source, /import \{ BackButton \} from "@\/components\/BackButton"/);
  assert.match(source, /<BackButton\b[\s\S]*label="返回世界"[\s\S]*router\.push\("\/world"\)/);
});

test("literature child routes use the shared readable back control", () => {
  for (const file of [
    "app/(game)/literature/read/[bookId]/page.tsx",
    "app/(game)/literature/deck/[deckId]/page.tsx",
  ]) {
    const source = readFileSync(file, "utf8");

    assert.match(source, /import \{ BackButton \} from "@\/components\/BackButton"/, file);
    assert.match(source, /<BackButton\b[\s\S]*label="诸子智慧"/, file);
    assert.doesNotMatch(source, /className="text-white\/90 text-sm mb-3"/, file);
  }
});

test("quote card interpretation starts speech directly instead of opening a chat prompt", () => {
  const source = readFileSync("components/games/literature/QuoteDeckPlayer.tsx", "utf8");

  assert.doesNotMatch(source, /FairyChat/);
  assert.doesNotMatch(source, /openingPrompt/);
  assert.match(source, /const interpretCard = \(\) => \{/);
  assert.match(source, /speakChunks\(card\.interpretation,\s*\{\s*lang: "zh-CN"/);
});
