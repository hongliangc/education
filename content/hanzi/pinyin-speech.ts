export type PinyinSsmlBase = "a" | "o" | "e" | "i" | "u" | "v";
export type PinyinTone = 1 | 2 | 3 | 4;

const PLACEHOLDER: Record<PinyinSsmlBase, string> = {
  a: "啊",
  o: "喔",
  e: "鹅",
  i: "衣",
  u: "乌",
  v: "鱼",
};

export function pinyinSsml(base: PinyinSsmlBase, tone: PinyinTone): string {
  return `<speak><phoneme alphabet="py" ph="${base}${tone}">${PLACEHOLDER[base]}</phoneme></speak>`;
}

export function repeatedPinyinSsml(base: PinyinSsmlBase, tone: PinyinTone): string {
  const phoneme = `<phoneme alphabet="py" ph="${base}${tone}">${PLACEHOLDER[base]}</phoneme>`;
  return `<speak>${phoneme}<break time="300ms"/>${phoneme}<break time="300ms"/>${phoneme}</speak>`;
}
