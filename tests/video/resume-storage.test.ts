import assert from "node:assert/strict";
import test from "node:test";

// @ts-expect-error Node's native TypeScript test runner requires the explicit extension.
import { readResumePosition, rememberResumePosition } from "../../lib/video/resume-storage.ts";

class MemoryStorage {
  private readonly values = new Map<string, string>();

  getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.values.set(key, value);
  }

  removeItem(key: string): void {
    this.values.delete(key);
  }
}

test("stores and reads a per-video resume position", () => {
  const storage = new MemoryStorage();

  rememberResumePosition("episode-1", 83.6, storage);

  assert.equal(readResumePosition("episode-1", storage), 83);
  assert.equal(readResumePosition("episode-2", storage), 0);
});

test("clears near-start and near-finished resume positions", () => {
  const storage = new MemoryStorage();

  rememberResumePosition("episode-1", 120, storage);
  rememberResumePosition("episode-1", 2, storage);
  assert.equal(readResumePosition("episode-1", storage), 0);

  rememberResumePosition("episode-1", 120, storage);
  rememberResumePosition("episode-1", 294, storage, 300);
  assert.equal(readResumePosition("episode-1", storage), 0);
});
