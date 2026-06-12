import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("uses chunked speech for fairy replies so long answers continue to the end", async () => {
  const source = await readFile(
    new URL("../../components/fairy/FairyChat.tsx", import.meta.url),
    "utf8",
  );

  assert.match(source, /speakRef\.current = speakChunks\(text,/);
  assert.doesNotMatch(source, /speakRef\.current = speakTextStream\(text,/);
});
