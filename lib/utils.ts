export function shuffle<T>(arr: readonly T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export const MODULES = ["WRITING", "ALPHABET", "WORDS", "MATH", "STORY", "LITERATURE"] as const;
export type ModuleId = (typeof MODULES)[number];

export const MODULE_META: Record<ModuleId, { label: string; emoji: string; color: string }> = {
  WRITING:    { label: "汉字学习", emoji: "✏️", color: "#f472b6" },
  ALPHABET:   { label: "英语岛", emoji: "🔤", color: "#60a5fa" },
  WORDS:      { label: "单词配对", emoji: "📖", color: "#34d399" },
  MATH:       { label: "趣味算术", emoji: "🔢", color: "#fbbf24" },
  STORY:      { label: "故事智慧", emoji: "📜", color: "#a78bfa" },
  LITERATURE: { label: "诸子智慧", emoji: "🪷", color: "#2dd4bf" },
};
