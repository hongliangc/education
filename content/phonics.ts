// Grade-aware alphabet & phonics content. This is the self-contained implementation leaf: data
// tables, skill-tagged generators, and the round orchestration all live here so the module pulls
// no runtime value imports (only the erased `Grade` type). `content/alphabet.ts` re-exports it
// under the module's public name. Every generator returns a uniform AlphabetQuestion so the round
// components can render letter tiles, picture cards, or masked words from one shape.
import type { Grade } from "@/lib/grades";

export type AlphabetSkill =
  | "LETTER_SHAPE"
  | "CASE_MATCH"
  | "LETTER_SOUND"
  | "INITIAL_SOUND"
  | "CVC"
  | "LONG_VOWEL"
  | "DIGRAPH"
  | "BLEND"
  | "WORD_FAMILY";

export interface AlphabetQuestion {
  id: string;
  grade: Grade;
  skill: AlphabetSkill;
  prompt: string;
  choices: string[];
  answer: string;
  speak: { text: string; lang: string };
  // Display fields — present only for the skills that use them.
  letter?: { upper: string; lower: string };
  emoji?: string;
  word?: string;
  masked?: string;
}

// ---------------------------------------------------------------------------
// Random helpers (kept local so the content modules carry no runtime imports).
// ---------------------------------------------------------------------------
function randomInt(min: number, max: number): number {
  return min + Math.floor(Math.random() * (max - min + 1));
}

function shuffle<T>(items: T[]): T[] {
  for (let index = items.length - 1; index > 0; index--) {
    const swapIndex = randomInt(0, index);
    [items[index], items[swapIndex]] = [items[swapIndex]!, items[index]!];
  }
  return items;
}

function pick<T>(items: readonly T[]): T {
  return items[randomInt(0, items.length - 1)]!;
}

// Pick `count` distinct items from `pool` that satisfy `keep`, excluding nothing extra.
function distinct<T>(pool: readonly T[], count: number, keep: (item: T) => boolean): T[] {
  const chosen: T[] = [];
  for (const item of shuffle(pool.filter(keep))) {
    if (chosen.length === count) break;
    chosen.push(item);
  }
  return chosen;
}

const EN = "en-US";
const VOWELS = ["a", "e", "i", "o", "u"] as const;

// ---------------------------------------------------------------------------
// Data tables
// ---------------------------------------------------------------------------
interface LetterWord {
  letter: string;
  word: string;
  emoji: string;
}

// One familiar word per letter for letter-sound and initial-sound work.
export const LETTER_WORDS: readonly LetterWord[] = [
  { letter: "A", word: "apple", emoji: "🍎" },
  { letter: "B", word: "ball", emoji: "⚽" },
  { letter: "C", word: "cat", emoji: "🐱" },
  { letter: "D", word: "dog", emoji: "🐶" },
  { letter: "E", word: "egg", emoji: "🥚" },
  { letter: "F", word: "fish", emoji: "🐟" },
  { letter: "G", word: "goat", emoji: "🐐" },
  { letter: "H", word: "hat", emoji: "🎩" },
  { letter: "I", word: "igloo", emoji: "🛖" },
  { letter: "J", word: "juice", emoji: "🧃" },
  { letter: "K", word: "kite", emoji: "🪁" },
  { letter: "L", word: "lion", emoji: "🦁" },
  { letter: "M", word: "moon", emoji: "🌙" },
  { letter: "N", word: "nest", emoji: "🪺" },
  { letter: "O", word: "orange", emoji: "🍊" },
  { letter: "P", word: "pig", emoji: "🐷" },
  { letter: "Q", word: "queen", emoji: "👑" },
  { letter: "R", word: "rabbit", emoji: "🐰" },
  { letter: "S", word: "sun", emoji: "☀️" },
  { letter: "T", word: "tiger", emoji: "🐯" },
  { letter: "U", word: "umbrella", emoji: "☂️" },
  { letter: "V", word: "van", emoji: "🚐" },
  { letter: "W", word: "whale", emoji: "🐳" },
  { letter: "X", word: "xylophone", emoji: "🎼" },
  { letter: "Y", word: "yarn", emoji: "🧶" },
  { letter: "Z", word: "zebra", emoji: "🦓" },
];

const UPPERCASE = LETTER_WORDS.map((entry) => entry.letter);

interface VowelWord {
  word: string;
  emoji: string;
  vowel: string;
}

// CVC words: the short vowel sits in the middle slot.
export const CVC_WORDS: readonly VowelWord[] = [
  { word: "cat", emoji: "🐱", vowel: "a" },
  { word: "hat", emoji: "🎩", vowel: "a" },
  { word: "bag", emoji: "🎒", vowel: "a" },
  { word: "fan", emoji: "🪭", vowel: "a" },
  { word: "bed", emoji: "🛏️", vowel: "e" },
  { word: "hen", emoji: "🐔", vowel: "e" },
  { word: "pen", emoji: "🖊️", vowel: "e" },
  { word: "pig", emoji: "🐷", vowel: "i" },
  { word: "lip", emoji: "👄", vowel: "i" },
  { word: "fox", emoji: "🦊", vowel: "o" },
  { word: "pot", emoji: "🍲", vowel: "o" },
  { word: "log", emoji: "🪵", vowel: "o" },
  { word: "sun", emoji: "☀️", vowel: "u" },
  { word: "bus", emoji: "🚌", vowel: "u" },
  { word: "cup", emoji: "☕", vowel: "u" },
];

// Long-vowel (magic-e) words: the long vowel is the second letter.
export const LONG_VOWEL_WORDS: readonly VowelWord[] = [
  { word: "cake", emoji: "🍰", vowel: "a" },
  { word: "gate", emoji: "🚪", vowel: "a" },
  { word: "lake", emoji: "🏞️", vowel: "a" },
  { word: "kite", emoji: "🪁", vowel: "i" },
  { word: "bike", emoji: "🚲", vowel: "i" },
  { word: "vine", emoji: "🍇", vowel: "i" },
  { word: "rose", emoji: "🌹", vowel: "o" },
  { word: "nose", emoji: "👃", vowel: "o" },
  { word: "bone", emoji: "🦴", vowel: "o" },
  { word: "cube", emoji: "🧊", vowel: "u" },
  { word: "tube", emoji: "🧪", vowel: "u" },
  { word: "mule", emoji: "🐴", vowel: "u" },
];

interface OnsetWord {
  word: string;
  emoji: string;
  onset: string;
}

export const DIGRAPHS = ["sh", "ch", "th", "wh"] as const;

export const DIGRAPH_WORDS: readonly OnsetWord[] = [
  { word: "ship", emoji: "🚢", onset: "sh" },
  { word: "shark", emoji: "🦈", onset: "sh" },
  { word: "sheep", emoji: "🐑", onset: "sh" },
  { word: "chair", emoji: "🪑", onset: "ch" },
  { word: "cheese", emoji: "🧀", onset: "ch" },
  { word: "cherry", emoji: "🍒", onset: "ch" },
  { word: "thumb", emoji: "👍", onset: "th" },
  { word: "thorn", emoji: "🌵", onset: "th" },
  { word: "whale", emoji: "🐳", onset: "wh" },
  { word: "wheel", emoji: "🛞", onset: "wh" },
];

export const BLENDS = ["fr", "fl", "cl", "st", "sn", "pl", "dr", "cr", "gl", "br", "gr", "sp", "tr", "sk", "sw"] as const;

export const BLEND_WORDS: readonly OnsetWord[] = [
  { word: "frog", emoji: "🐸", onset: "fr" },
  { word: "flag", emoji: "🚩", onset: "fl" },
  { word: "clock", emoji: "🕐", onset: "cl" },
  { word: "star", emoji: "⭐", onset: "st" },
  { word: "snail", emoji: "🐌", onset: "sn" },
  { word: "plum", emoji: "🫐", onset: "pl" },
  { word: "drum", emoji: "🥁", onset: "dr" },
  { word: "crab", emoji: "🦀", onset: "cr" },
  { word: "glove", emoji: "🧤", onset: "gl" },
  { word: "brush", emoji: "🪥", onset: "br" },
  { word: "grapes", emoji: "🍇", onset: "gr" },
  { word: "spoon", emoji: "🥄", onset: "sp" },
  { word: "tree", emoji: "🌳", onset: "tr" },
  { word: "skate", emoji: "⛸️", onset: "sk" },
  { word: "swing", emoji: "🛝", onset: "sw" },
];

interface FamilyMember {
  word: string;
  emoji: string;
}

interface WordFamily {
  rime: string;
  members: readonly FamilyMember[];
}

// CVC families, so each member's rime is exactly `word.slice(1)`.
export const WORD_FAMILIES: readonly WordFamily[] = [
  { rime: "at", members: [{ word: "cat", emoji: "🐱" }, { word: "hat", emoji: "🎩" }, { word: "bat", emoji: "🦇" }, { word: "rat", emoji: "🐀" }] },
  { rime: "an", members: [{ word: "can", emoji: "🥫" }, { word: "man", emoji: "🧑" }, { word: "fan", emoji: "🪭" }, { word: "pan", emoji: "🍳" }] },
  { rime: "ig", members: [{ word: "pig", emoji: "🐷" }, { word: "wig", emoji: "💇" }, { word: "dig", emoji: "⛏️" }, { word: "fig", emoji: "🫐" }] },
  { rime: "og", members: [{ word: "dog", emoji: "🐶" }, { word: "log", emoji: "🪵" }, { word: "hog", emoji: "🐗" }, { word: "jog", emoji: "🏃" }] },
  { rime: "un", members: [{ word: "sun", emoji: "☀️" }, { word: "bun", emoji: "🍞" }, { word: "run", emoji: "🏃" }, { word: "fun", emoji: "🎉" }] },
  { rime: "en", members: [{ word: "hen", emoji: "🐔" }, { word: "pen", emoji: "🖊️" }, { word: "ten", emoji: "🔟" }, { word: "den", emoji: "🛖" }] },
];

// ---------------------------------------------------------------------------
// Skill generators
// ---------------------------------------------------------------------------
function id(grade: Grade, skill: string, key: string): string {
  return `${grade}:${skill}:${key}`;
}

function letterChoices(answer: string): string[] {
  const distractors = distinct(UPPERCASE, 2, (l) => l !== answer);
  return shuffle([answer, ...distractors]);
}

function vowelChoices(answer: string): string[] {
  const distractors = distinct(VOWELS, 2, (v) => v !== answer);
  return shuffle([answer, ...distractors]);
}

function onsetChoices(answer: string, pool: readonly string[]): string[] {
  const distractors = distinct(pool, 2, (o) => o !== answer);
  return shuffle([answer, ...distractors]);
}

export function genLetterShape(grade: Grade): AlphabetQuestion {
  const letter = pick(UPPERCASE);
  return {
    id: id(grade, "LETTER_SHAPE", letter),
    grade,
    skill: "LETTER_SHAPE",
    prompt: "找出一样的字母",
    choices: letterChoices(letter),
    answer: letter,
    speak: { text: letter, lang: EN },
    letter: { upper: letter, lower: letter.toLowerCase() },
  };
}

export function genCaseMatch(grade: Grade): AlphabetQuestion {
  const letter = pick(UPPERCASE);
  return {
    id: id(grade, "CASE_MATCH", letter),
    grade,
    skill: "CASE_MATCH",
    prompt: "选出它的大写字母",
    choices: letterChoices(letter),
    answer: letter,
    speak: { text: letter, lang: EN },
    letter: { upper: letter, lower: letter.toLowerCase() },
  };
}

export function genLetterSound(grade: Grade): AlphabetQuestion {
  const entry = pick(LETTER_WORDS);
  const distractors = distinct(LETTER_WORDS, 2, (e) => e.letter !== entry.letter).map((e) => e.word);
  return {
    id: id(grade, "LETTER_SOUND", entry.letter),
    grade,
    skill: "LETTER_SOUND",
    prompt: `字母 ${entry.letter} 的发音，像哪个单词的开头？`,
    choices: shuffle([entry.word, ...distractors]),
    answer: entry.word,
    speak: { text: entry.word, lang: EN },
    letter: { upper: entry.letter, lower: entry.letter.toLowerCase() },
    emoji: entry.emoji,
  };
}

export function genInitialSound(grade: Grade): AlphabetQuestion {
  const entry = pick(LETTER_WORDS);
  return {
    id: id(grade, "INITIAL_SOUND", entry.letter),
    grade,
    skill: "INITIAL_SOUND",
    prompt: "这个词以哪个字母开头？",
    choices: letterChoices(entry.letter),
    answer: entry.letter,
    speak: { text: entry.word, lang: EN },
    emoji: entry.emoji,
    word: entry.word,
  };
}

function maskMiddle(word: string): string {
  return `${word[0]} _ ${word.slice(2)}`;
}

export function genCVC(grade: Grade): AlphabetQuestion {
  const entry = pick(CVC_WORDS);
  return {
    id: id(grade, "CVC", entry.word),
    grade,
    skill: "CVC",
    prompt: "中间是哪个字母？",
    choices: vowelChoices(entry.vowel),
    answer: entry.vowel,
    speak: { text: entry.word, lang: EN },
    emoji: entry.emoji,
    word: entry.word,
    masked: maskMiddle(entry.word),
  };
}

export function genLongVowel(grade: Grade): AlphabetQuestion {
  const entry = pick(LONG_VOWEL_WORDS);
  return {
    id: id(grade, "LONG_VOWEL", entry.word),
    grade,
    skill: "LONG_VOWEL",
    prompt: "长元音是哪个字母？",
    choices: vowelChoices(entry.vowel),
    answer: entry.vowel,
    speak: { text: entry.word, lang: EN },
    emoji: entry.emoji,
    word: entry.word,
    masked: maskMiddle(entry.word),
  };
}

export function genDigraph(grade: Grade): AlphabetQuestion {
  const entry = pick(DIGRAPH_WORDS);
  return {
    id: id(grade, "DIGRAPH", entry.word),
    grade,
    skill: "DIGRAPH",
    prompt: "开头的字母组合是哪个？",
    choices: onsetChoices(entry.onset, DIGRAPHS),
    answer: entry.onset,
    speak: { text: entry.word, lang: EN },
    emoji: entry.emoji,
    word: entry.word,
    masked: `_${entry.word.slice(2)}`,
  };
}

export function genBlend(grade: Grade): AlphabetQuestion {
  const entry = pick(BLEND_WORDS);
  return {
    id: id(grade, "BLEND", entry.word),
    grade,
    skill: "BLEND",
    prompt: "开头的字母组合是哪个？",
    choices: onsetChoices(entry.onset, BLENDS),
    answer: entry.onset,
    speak: { text: entry.word, lang: EN },
    emoji: entry.emoji,
    word: entry.word,
    masked: `_${entry.word.slice(2)}`,
  };
}

export function genWordFamily(grade: Grade): AlphabetQuestion {
  const family = pick(WORD_FAMILIES);
  const [anchor, correct] = shuffle([...family.members]);
  const distractors = distinct(
    WORD_FAMILIES.flatMap((f) => (f.rime === family.rime ? [] : f.members)),
    2,
    () => true,
  ).map((m) => m.word);
  return {
    id: id(grade, "WORD_FAMILY", `${family.rime}:${anchor!.word}`),
    grade,
    skill: "WORD_FAMILY",
    prompt: `和「${anchor!.word}」同一个词族的是哪个？`,
    choices: shuffle([correct!.word, ...distractors]),
    answer: correct!.word,
    speak: { text: anchor!.word, lang: EN },
    emoji: anchor!.emoji,
    word: anchor!.word,
    masked: `-${family.rime}`,
  };
}

// ---------------------------------------------------------------------------
// Round orchestration
// ---------------------------------------------------------------------------
type Generator = (grade: Grade) => AlphabetQuestion;

const GENERATORS: Record<AlphabetSkill, Generator> = {
  LETTER_SHAPE: genLetterShape,
  CASE_MATCH: genCaseMatch,
  LETTER_SOUND: genLetterSound,
  INITIAL_SOUND: genInitialSound,
  CVC: genCVC,
  LONG_VOWEL: genLongVowel,
  DIGRAPH: genDigraph,
  BLEND: genBlend,
  WORD_FAMILY: genWordFamily,
};

// Per-grade skill progression (design §4.2).
const GRADE_SKILLS: Record<Grade, AlphabetSkill[]> = {
  K1: ["LETTER_SHAPE", "CASE_MATCH"],
  K2: ["CASE_MATCH", "LETTER_SOUND", "INITIAL_SOUND"],
  K3: ["LETTER_SOUND", "INITIAL_SOUND", "CVC"],
  G1: ["INITIAL_SOUND", "CVC"],
  G2: ["LONG_VOWEL", "DIGRAPH"],
  G3: ["DIGRAPH", "BLEND", "WORD_FAMILY"],
};

// Letter-tile display (AlphabetRound) vs picture/word cards (PhonicsRound).
const LETTER_DISPLAY_SKILLS = new Set<AlphabetSkill>(["LETTER_SHAPE", "CASE_MATCH"]);

export function getGradeSkills(grade: Grade): AlphabetSkill[] {
  return GRADE_SKILLS[grade];
}

export function isLetterDisplaySkill(skill: AlphabetSkill): boolean {
  return LETTER_DISPLAY_SKILLS.has(skill);
}

export function generateRound(grade: Grade, count = 5): AlphabetQuestion[] {
  const skills = GRADE_SKILLS[grade];
  const round: AlphabetQuestion[] = [];
  const seen = new Set<string>();
  let slot = 0;
  // Cycle the grade's skills, retrying within a slot to avoid repeating a question.
  while (round.length < count) {
    const skill = skills[slot % skills.length]!;
    let question = GENERATORS[skill](grade);
    for (let attempt = 0; attempt < 6 && seen.has(question.id); attempt++) {
      question = GENERATORS[skill](grade);
    }
    if (!seen.has(question.id)) {
      seen.add(question.id);
      round.push(question);
    }
    slot++;
    // Guard against an exhausted skill (small pool) blocking the round.
    if (slot > count * 12) break;
  }
  return round;
}
