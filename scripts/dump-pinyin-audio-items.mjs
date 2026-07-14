import { writeFile } from "node:fs/promises";

const { PINYIN_AUDIO_ITEMS } = await import("../content/hanzi/pinyin-audio.ts");
const output = new URL("./pinyin-audio-items.json", import.meta.url);

await writeFile(output, `${JSON.stringify(PINYIN_AUDIO_ITEMS, null, 2)}\n`, "utf8");
console.log(`wrote ${PINYIN_AUDIO_ITEMS.length} items to ${output.pathname}`);
