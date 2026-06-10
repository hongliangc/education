// Grade One vocabulary (~120 cumulative target) — themed nouns plus CVC phonics words. Self-
// contained data leaf importing only the erased `GradedWord` type.
import type { GradedWord } from "../words";

function w(en: string, zh: string, emoji: string, category: string, phonics?: string): GradedWord {
  return {
    id: `g1-${en.replace(/\s+/g, "-")}`,
    grade: "G1",
    en,
    zh,
    emoji,
    category,
    ...(phonics ? { phonics } : {}),
  };
}

export const GRADE_ONE_WORDS: GradedWord[] = [
  // nature
  w("tree", "树", "🌳", "nature"),
  w("flower", "花", "🌷", "nature"),
  w("grass", "草", "🌿", "nature"),
  w("leaf", "叶子", "🍃", "nature"),
  w("rock", "石头", "🪨", "nature"),
  w("river", "河", "🏞️", "nature"),
  w("mountain", "山", "⛰️", "nature"),
  w("star", "星星", "⭐", "nature"),
  w("moon", "月亮", "🌙", "nature"),
  w("fire", "火", "🔥", "nature"),
  // animals
  w("lion", "狮子", "🦁", "animals"),
  w("tiger", "老虎", "🐯", "animals"),
  w("bear", "熊", "🐻", "animals"),
  w("monkey", "猴子", "🐵", "animals"),
  w("elephant", "大象", "🐘", "animals"),
  w("rabbit", "兔子", "🐰", "animals"),
  w("mouse", "老鼠", "🐭", "animals"),
  w("sheep", "绵羊", "🐑", "animals"),
  w("goat", "山羊", "🐐", "animals"),
  w("fox", "狐狸", "🦊", "animals"),
  w("ant", "蚂蚁", "🐜", "animals"),
  w("owl", "猫头鹰", "🦉", "animals"),
  w("crab", "螃蟹", "🦀", "animals"),
  w("snail", "蜗牛", "🐌", "animals"),
  // food
  w("grape", "葡萄", "🍇", "food"),
  w("lemon", "柠檬", "🍋", "food"),
  w("pear", "梨", "🍐", "food"),
  w("peach", "桃子", "🍑", "food"),
  w("carrot", "胡萝卜", "🥕", "food"),
  w("potato", "土豆", "🥔", "food"),
  w("tomato", "番茄", "🍅", "food"),
  w("corn", "玉米", "🌽", "food"),
  w("honey", "蜂蜜", "🍯", "food"),
  w("juice", "果汁", "🧃", "food"),
  // transport
  w("car", "汽车", "🚗", "transport"),
  w("bus", "公交车", "🚌", "transport"),
  w("train", "火车", "🚆", "transport"),
  w("plane", "飞机", "✈️", "transport"),
  w("boat", "船", "⛵", "transport"),
  w("bike", "自行车", "🚲", "transport"),
  w("truck", "卡车", "🚚", "transport"),
  // home
  w("house", "房子", "🏠", "home"),
  w("window", "窗户", "🪟", "home"),
  w("sofa", "沙发", "🛋️", "home"),
  w("lamp", "台灯", "💡", "home"),
  w("box", "盒子", "📦", "home"),
  w("mirror", "镜子", "🪞", "home"),
  // CVC phonics words
  w("hen", "母鸡", "🐔", "phonics", "h-e-n"),
  w("bug", "虫子", "🐛", "phonics", "b-u-g"),
  w("net", "网", "🥅", "phonics", "n-e-t"),
  w("jam", "果酱", "🍓", "phonics", "j-a-m"),
  w("mug", "马克杯", "🍵", "phonics", "m-u-g"),
  w("log", "木头", "🪵", "phonics", "l-o-g"),
];
