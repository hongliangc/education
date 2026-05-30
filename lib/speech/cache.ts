import "server-only";
import { createHash } from "crypto";
import { promises as fs } from "fs";
import path from "path";

const DIR = process.env.TTS_CACHE_DIR ?? path.join(process.cwd(), ".cache/tts");

export function ttsCacheKey(text: string, voice: string, lang: string): string {
  return createHash("sha256").update(`${lang}|${voice}|${text}`).digest("hex");
}

export async function readTtsCache(key: string): Promise<Buffer | null> {
  try {
    return await fs.readFile(path.join(DIR, `${key}.mp3`));
  } catch {
    return null;
  }
}

export async function writeTtsCache(key: string, buf: Buffer): Promise<void> {
  await fs.mkdir(DIR, { recursive: true });
  await fs.writeFile(path.join(DIR, `${key}.mp3`), buf);
}
