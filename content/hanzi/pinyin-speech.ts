export type PinyinSsmlBase = "a" | "o" | "e" | "i" | "u" | "v";
export type PinyinTone = 1 | 2 | 3 | 4;

const TONE_MARKS: Record<string, readonly [string, string, string, string]> = {
  a: ["ā", "á", "ǎ", "à"], e: ["ē", "é", "ě", "è"], i: ["ī", "í", "ǐ", "ì"],
  o: ["ō", "ó", "ǒ", "ò"], u: ["ū", "ú", "ǔ", "ù"], ü: ["ǖ", "ǘ", "ǚ", "ǜ"],
};

const TONE_PLACEHOLDERS: Record<PinyinSsmlBase, readonly [string, string, string, string]> = {
  a: ["妈", "麻", "马", "骂"],
  o: ["窝", "伯", "我", "卧"],
  e: ["婀", "额", "我", "饿"],
  i: ["衣", "姨", "椅", "意"],
  u: ["乌", "无", "五", "物"],
  v: ["迂", "鱼", "雨", "玉"],
};

export function pinyinSsml(base: PinyinSsmlBase, tone: PinyinTone): string {
  return `<speak><phoneme alphabet="py" ph="${base}${tone}">${TONE_PLACEHOLDERS[base][tone - 1]}</phoneme></speak>`;
}

export function repeatedPinyinSsml(base: PinyinSsmlBase, tone: PinyinTone): string {
  const phoneme = `<phoneme alphabet="py" ph="${base}${tone}">${TONE_PLACEHOLDERS[base][tone - 1]}</phoneme>`;
  return `<speak>${phoneme}<break time="300ms"/>${phoneme}<break time="300ms"/>${phoneme}</speak>`;
}

export function toneMarkedSyllables(syllable: string): [string, string, string, string] {
  const vowelIndex = toneVowelIndex(syllable);
  if (vowelIndex < 0) return [syllable, syllable, syllable, syllable];
  const vowel = syllable[vowelIndex];
  const marks = TONE_MARKS[vowel];
  return marks.map((mark) => `${syllable.slice(0, vowelIndex)}${mark}${syllable.slice(vowelIndex + 1)}`) as [string, string, string, string];
}

export function syllableToneSsml(phonemeBase: string, tone: PinyinTone): string {
  const carriers = ["妈", "麻", "马", "骂"] as const;
  return `<speak><phoneme alphabet="py" ph="${phonemeBase}${tone}">${carriers[tone - 1]}</phoneme></speak>`;
}

function toneVowelIndex(syllable: string): number {
  for (const vowel of ["a", "o", "e"]) { const index = syllable.indexOf(vowel); if (index >= 0) return index; }
  for (let index = syllable.length - 1; index >= 0; index -= 1) if ("iuü".includes(syllable[index])) return index;
  return -1;
}
