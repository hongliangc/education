import type { HanziItem, PrimaryGradeLevel } from "./catalog";
import type { HanziProgressMap } from "./progress";

export type HanziRecognitionMode = "char-meaning" | "meaning-char" | "pinyin-char" | "word-char";

export interface HanziChoice {
  id: string;
  char: string;
  label: string;
  pinyin: string;
}

export interface HanziChallenge {
  id: string;
  level: PrimaryGradeLevel;
  mode: HanziRecognitionMode;
  prompt: string;
  speak: { text: string; lang: "zh-CN" };
  choices: HanziChoice[];
  answerId: string;
}

export function isPrimaryGradeLevel(
  value: unknown,
  levels: readonly PrimaryGradeLevel[],
): value is PrimaryGradeLevel {
  return typeof value === "string" && (levels as readonly string[]).includes(value);
}

export function getHanziForLevel(
  catalog: readonly HanziItem[],
  level: PrimaryGradeLevel,
): HanziItem[] {
  return catalog.filter((item) => item.level === level);
}

export function getHanziForPrimaryGrade(
  catalog: readonly HanziItem[],
  levels: readonly PrimaryGradeLevel[],
  level: PrimaryGradeLevel,
): HanziItem[] {
  const ceiling = levels.indexOf(level);
  return catalog.filter((item) => levels.indexOf(item.level) <= ceiling);
}

export function generateHanziChallenges(
  catalog: readonly HanziItem[],
  levels: readonly PrimaryGradeLevel[],
  level: PrimaryGradeLevel,
  count = 8,
  rng: () => number = Math.random,
  progress?: HanziProgressMap,
  now = Date.now(),
): HanziChallenge[] {
  const fullPool = getHanziForPrimaryGrade(catalog, levels, level);
  const pool = progress ? selectRoundCandidates(fullPool, progress, now) : fullPool;
  const answers = pickRound(pool, count, rng);
  const modes: readonly HanziRecognitionMode[] = [
    "char-meaning",
    "meaning-char",
    "pinyin-char",
    "word-char",
  ];

  return answers.map((answer, index) =>
    buildChallenge(answer, pool, modes[index % modes.length], index, rng),
  );
}

export function pickHanziWritingRound(
  catalog: readonly HanziItem[],
  levels: readonly PrimaryGradeLevel[],
  level: PrimaryGradeLevel,
  count = 4,
  rng: () => number = Math.random,
  progress?: HanziProgressMap,
  now = Date.now(),
): HanziItem[] {
  const fullPool = getHanziForPrimaryGrade(catalog, levels, level);
  const pool = progress ? selectRoundCandidates(fullPool, progress, now) : fullPool;
  return pickRound(pool, count, rng);
}

function buildChallenge(
  answer: HanziItem,
  pool: readonly HanziItem[],
  mode: HanziRecognitionMode,
  index: number,
  rng: () => number,
): HanziChallenge {
  const choices = shuffled(
    [
      answer,
      ...pickDistinct(pool, 3, rng, (item) => item.id !== answer.id, (item) => item.char),
    ],
    rng,
  ).map(toChoice);

  const word = answer.words[0] ?? answer.char;
  const promptByMode: Record<HanziRecognitionMode, string> = {
    "char-meaning": `「${answer.char}」是什么意思？`,
    "meaning-char": `哪个字表示：${answer.meaning}`,
    "pinyin-char": `听拼音：${answer.pinyin}`,
    "word-char": `词语「${word}」里学的是哪个字？`,
  };

  return {
    id: `${mode}-${answer.id}-${index}`,
    level: answer.level,
    mode,
    prompt: promptByMode[mode],
    speak: { text: mode === "pinyin-char" ? answer.char : promptByMode[mode], lang: "zh-CN" },
    choices,
    answerId: answer.id,
  };
}

function toChoice(item: HanziItem): HanziChoice {
  return {
    id: item.id,
    char: item.char,
    label: item.meaning,
    pinyin: item.pinyin,
  };
}

function pickRound<T>(pool: readonly T[], count: number, rng: () => number): T[] {
  return shuffled(pool, rng).slice(0, Math.min(count, pool.length));
}

function selectRoundCandidates<T extends { id: string }>(
  items: readonly T[],
  progress: HanziProgressMap,
  now: number,
): T[] {
  return items.filter((item) => {
    const entry = progress[item.id];
    if (!entry || entry.correctStreak < 3) return true;
    return typeof entry.nextReviewAt === "number" && entry.nextReviewAt <= now;
  });
}

function pickDistinct<T>(
  pool: readonly T[],
  count: number,
  rng: () => number,
  eligible: (item: T) => boolean,
  keyOf: (item: T) => string,
): T[] {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const item of shuffled(pool, rng)) {
    if (out.length >= count) break;
    if (!eligible(item)) continue;
    const key = keyOf(item);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(item);
  }
  return out;
}

function shuffled<T>(items: readonly T[], rng: () => number): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}
