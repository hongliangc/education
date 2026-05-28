// 写字练习 — 基础汉字
export interface CharItem {
  char: string;
  pinyin: string;
  meaning: string;
  hint: string;
}

export const CHARS: CharItem[] = [
  { char: "一", pinyin: "yī", meaning: "数字一", hint: "一横，从左到右" },
  { char: "二", pinyin: "èr", meaning: "数字二", hint: "两横，上短下长" },
  { char: "三", pinyin: "sān", meaning: "数字三", hint: "三横，中间最短" },
  { char: "口", pinyin: "kǒu", meaning: "嘴巴", hint: "像一个小方框" },
  { char: "日", pinyin: "rì", meaning: "太阳", hint: "口里加一横" },
  { char: "月", pinyin: "yuè", meaning: "月亮", hint: "弯弯像月牙" },
  { char: "木", pinyin: "mù", meaning: "树木", hint: "一横，竖，撇，捺" },
  { char: "水", pinyin: "shuǐ", meaning: "水", hint: "像水流的波浪" },
  { char: "火", pinyin: "huǒ", meaning: "火", hint: "上小下大，像火苗" },
  { char: "山", pinyin: "shān", meaning: "高山", hint: "三个山尖" },
];
