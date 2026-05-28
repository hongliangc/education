// 英文字母 — 字母 + 例词 + emoji
export interface LetterItem {
  letter: string;
  word: string;
  emoji: string;
}

export const ALPHABET: LetterItem[] = [
  { letter: "A", word: "Apple", emoji: "🍎" },
  { letter: "B", word: "Bear", emoji: "🐻" },
  { letter: "C", word: "Cat", emoji: "🐱" },
  { letter: "D", word: "Dog", emoji: "🐶" },
  { letter: "E", word: "Elephant", emoji: "🐘" },
  { letter: "F", word: "Fish", emoji: "🐠" },
  { letter: "G", word: "Giraffe", emoji: "🦒" },
  { letter: "H", word: "Hat", emoji: "🎩" },
  { letter: "I", word: "Ice", emoji: "🧊" },
  { letter: "J", word: "Juice", emoji: "🧃" },
];
