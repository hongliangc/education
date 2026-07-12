// @ts-expect-error Node's native TypeScript tests require the explicit extension.
import { HANZI_CATALOG, HANZI_LEVELS, type HanziItem, type PrimaryGradeLevel } from "./catalog.ts";

export interface HanziKeyWord {
  id: string;
  word: string;
  level: PrimaryGradeLevel;
  items: readonly HanziItem[];
  example: string;
}

const easiestItemByChar = new Map<string, HanziItem>();
for (const item of HANZI_CATALOG) {
  const previous = easiestItemByChar.get(item.char);
  if (!previous || HANZI_LEVELS.indexOf(item.level) < HANZI_LEVELS.indexOf(previous.level)) easiestItemByChar.set(item.char, item);
}

export const HANZI_KEY_WORDS: readonly HanziKeyWord[] = selectBalancedWords(buildKeyWords());

export function getKeyWordsForPrimaryGrade(level: PrimaryGradeLevel): readonly HanziKeyWord[] {
  const maxLevel = HANZI_LEVELS.indexOf(level);
  return HANZI_KEY_WORDS.filter((word) => HANZI_LEVELS.indexOf(word.level) <= maxLevel);
}

function buildKeyWords(): HanziKeyWord[] {
  const words = new Set(HANZI_CATALOG.flatMap((item) => item.words));
  return [...words].flatMap((word) => {
    const chars = [...word];
    if (chars.length < 2 || chars.length > 4) return [];
    const items = chars.map((char) => easiestItemByChar.get(char));
    if (items.some((item) => !item)) return [];
    const completeItems = items.filter((item): item is HanziItem => Boolean(item));
    const level = completeItems.reduce((hardest, item) => HANZI_LEVELS.indexOf(item.level) > HANZI_LEVELS.indexOf(hardest) ? item.level : hardest, "G1" as PrimaryGradeLevel);
    return [{ id: `${level}-${word}`, word, level, items: completeItems, example: `我学会了“${word}”这个词，还能把它写出来。` }];
  }).sort((a, b) => HANZI_LEVELS.indexOf(a.level) - HANZI_LEVELS.indexOf(b.level) || a.word.localeCompare(b.word, "zh-CN"));
}

function selectBalancedWords(words: readonly HanziKeyWord[]): HanziKeyWord[] {
  return HANZI_LEVELS.flatMap((level, index) => words.filter((word) => word.level === level).slice(0, index < 2 ? 34 : 33));
}
