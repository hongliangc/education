import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync("components/games/english/EnglishHub.tsx", "utf8");

test("English island exposes the shared return control back to the world", () => {
  assert.match(source, /import \{ BackButton \} from "@\/components\/BackButton"/);
  assert.match(source, /<BackButton\b[\s\S]*label="返回世界"[\s\S]*router\.push\("\/world"\)/);
});
