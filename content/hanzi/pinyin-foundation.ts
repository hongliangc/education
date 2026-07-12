export interface PinyinFoundation {
  base: string;
  ssmlBase: import("./pinyin-speech").PinyinSsmlBase;
  name: string;
  hint: string;
  speech: string;
  tones: readonly [string, string, string, string];
}

export const PINYIN_FOUNDATIONS: readonly PinyinFoundation[] = [
  { base: "a", ssmlBase: "a", name: "单韵母 a", hint: "张大嘴巴 a a a", speech: "啊", tones: ["ā", "á", "ǎ", "à"] },
  { base: "o", ssmlBase: "o", name: "单韵母 o", hint: "圆圆嘴巴 o o o", speech: "喔", tones: ["ō", "ó", "ǒ", "ò"] },
  { base: "e", ssmlBase: "e", name: "单韵母 e", hint: "扁扁嘴巴 e e e", speech: "鹅", tones: ["ē", "é", "ě", "è"] },
  { base: "i", ssmlBase: "i", name: "单韵母 i", hint: "牙齿对齐 i i i", speech: "衣", tones: ["ī", "í", "ǐ", "ì"] },
  { base: "u", ssmlBase: "u", name: "单韵母 u", hint: "小圆嘴巴 u u u", speech: "乌", tones: ["ū", "ú", "ǔ", "ù"] },
  { base: "ü", ssmlBase: "v", name: "单韵母 ü", hint: "嘴巴吹笛 ü ü ü", speech: "鱼", tones: ["ǖ", "ǘ", "ǚ", "ǜ"] },
] as const;
