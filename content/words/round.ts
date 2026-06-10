// Pure round-selection helpers for the word matching game. This is a self-contained leaf: it
// carries only erased type imports (no runtime value imports), so the Node test runner can load
// it directly via its `.ts` path, while the catalog data is passed in as arguments.
import type { GradedWord } from "../words";
import type { Grade } from "@/lib/grades";

// Cumulative vocabulary up to and including `grade` (design §4.3 — higher grades build on lower
// ones). `order` is the difficulty ranking (easiest first); a word ranked at or below the target
// grade is in scope.
export function wordsUpToGrade(
  catalog: readonly GradedWord[],
  grade: Grade,
  order: readonly Grade[],
): GradedWord[] {
  const ceiling = order.indexOf(grade);
  return catalog.filter((word) => order.indexOf(word.grade) <= ceiling);
}

// Draw up to `count` distinct words from `pool` in random order. `rng` is injectable so tests can
// pin the shuffle; pools smaller than `count` return in full rather than padding or repeating.
export function pickRound(
  pool: readonly GradedWord[],
  count: number,
  rng: () => number = Math.random,
): GradedWord[] {
  return shuffled(pool, rng).slice(0, Math.min(count, pool.length));
}

// ---------------------------------------------------------------------------
// Grade-dispatched challenge model (design §4.3). Kindergarten keeps the image/Chinese matching
// grid; primary grades progress through harder presentations of the same cumulative vocabulary.
// ---------------------------------------------------------------------------

// "en-image": read the English word, tap its picture. "listen": hear the word, tap its picture.
// "phrase": read a short phrase, tap its picture. "sentence": fill a word into a sentence blank.
export type WordRoundKind = "en-image" | "listen" | "phrase" | "sentence";

export interface WordChoice {
  id: string; // the source word id — also the answer key
  label: string; // English word, used when the choices are text
  emoji: string;
}

export interface WordChallenge {
  id: string;
  kind: WordRoundKind;
  grade: Grade;
  prompt: string; // visible text; contains "______" for sentence blanks
  speak?: { text: string; lang: string };
  choiceMode: "emoji" | "word";
  choices: WordChoice[];
  answerId: string;
}

// Kindergarten (K*) uses the tap-matching grid; primary grades use multiple-choice challenges.
export function usesMatchingGrid(grade: Grade): boolean {
  return grade.startsWith("K");
}

// The challenge presentations unlocked at each grade. Empty means the matching grid is used.
export function roundKindsForGrade(grade: Grade): WordRoundKind[] {
  switch (grade) {
    case "G1":
      return ["en-image", "listen"];
    case "G2":
      return ["phrase"];
    case "G3":
      return ["sentence"];
    default:
      return [];
  }
}

// Build a round of multiple-choice challenges for a primary grade. Sentence rounds quiz only words
// that ship an example sentence; the others may draw any word from the cumulative pool.
export function generateChallenges(
  pool: readonly GradedWord[],
  grade: Grade,
  count = 5,
  rng: () => number = Math.random,
): WordChallenge[] {
  const kinds = roundKindsForGrade(grade);
  if (kinds.length === 0) return [];

  const needsSentence = kinds.includes("sentence");
  const answerPool = needsSentence ? pool.filter((w) => !!w.example) : pool;
  const answers = pickRound(answerPool, count, rng);

  return answers.map((answer, index) => {
    const kind = kinds[index % kinds.length];
    return kind === "sentence"
      ? buildSentenceChallenge(answer, answer.example ?? "", pool, grade, index, rng)
      : buildPictureChallenge(kind, answer, pool, grade, index, rng);
  });
}

function buildPictureChallenge(
  kind: Exclude<WordRoundKind, "sentence">,
  answer: GradedWord,
  pool: readonly GradedWord[],
  grade: Grade,
  index: number,
  rng: () => number,
): WordChallenge {
  // Distinct emojis only, so two tiles never look identical.
  const distractors = pickDistinct(
    pool,
    3,
    rng,
    (w) => w.id !== answer.id && w.emoji !== answer.emoji,
    (w) => w.emoji,
  );
  const choices = shuffled([answer, ...distractors], rng).map(toChoice);
  const prompt =
    kind === "listen"
      ? "🔊 仔细听，选出对应的图片"
      : kind === "phrase"
        ? phrasePrompt(answer)
        : capitalize(answer.en);
  return {
    id: `${kind}-${answer.id}-${index}`,
    kind,
    grade,
    prompt,
    // Speak the bare word for letter/word recognition; phrases are read in full.
    speak: { text: kind === "phrase" ? prompt : answer.en, lang: "en-US" },
    choiceMode: "emoji",
    choices,
    answerId: answer.id,
  };
}

// A short English phrase that still names the word, so a picture choice remains the answer.
function phrasePrompt(word: GradedWord): string {
  switch (word.category) {
    case "verbs":
      return `Let's ${word.en}!`;
    case "adjectives":
      return `It looks ${word.en}.`;
    case "feelings":
      return `I feel ${word.en}.`;
    default:
      return `Find the ${word.en}.`;
  }
}

function buildSentenceChallenge(
  answer: GradedWord,
  example: string,
  pool: readonly GradedWord[],
  grade: Grade,
  index: number,
  rng: () => number,
): WordChallenge {
  // Prefer same-category words so the reading choice is a real decision, then top up if needed.
  const sameCategory = pool.filter(
    (w) => w.id !== answer.id && w.example && w.category === answer.category,
  );
  const filler = pool.filter((w) => w.id !== answer.id && w.example);
  const distractors = pickDistinct(
    [...sameCategory, ...filler],
    3,
    rng,
    (w) => w.id !== answer.id && !!w.example,
    (w) => w.en,
  );
  const choices = shuffled([answer, ...distractors], rng).map(toChoice);
  return {
    id: `sentence-${answer.id}-${index}`,
    kind: "sentence",
    grade,
    prompt: blankWord(example, answer.en),
    speak: { text: example, lang: "en-US" },
    choiceMode: "word",
    choices,
    answerId: answer.id,
  };
}

function toChoice(word: GradedWord): WordChoice {
  return { id: word.id, label: word.en, emoji: word.emoji };
}

// Replace the first whole-word occurrence (case-insensitive) of `word` with a blank.
function blankWord(sentence: string, word: string): string {
  return sentence.replace(new RegExp(`\\b${word}\\b`, "i"), "______");
}

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

// Pick up to `count` items that are eligible and have distinct keys, in random order.
function pickDistinct(
  pool: readonly GradedWord[],
  count: number,
  rng: () => number,
  eligible: (word: GradedWord) => boolean,
  keyOf: (word: GradedWord) => string,
): GradedWord[] {
  const seen = new Set<string>();
  const out: GradedWord[] = [];
  for (const word of shuffled(pool, rng)) {
    if (out.length >= count) break;
    if (!eligible(word)) continue;
    const key = keyOf(word);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(word);
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
