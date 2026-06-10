// Kindergarten vocabulary (K1–K3) — picture words organised by theme (design §4.3). Self-contained
// data leaf: the only import is the erased `GradedWord` type, so the Node test runner loads it
// directly without resolving any runtime path.
import type { GradedWord } from "../words";

type Grade = GradedWord["grade"];

function w(grade: Grade, en: string, zh: string, emoji: string, category: string): GradedWord {
  return { id: `${grade.toLowerCase()}-${en.replace(/\s+/g, "-")}`, grade, en, zh, emoji, category };
}

export const KINDERGARTEN_WORDS: GradedWord[] = [
  // K1 — colors
  w("K1", "red", "红色", "🔴", "colors"),
  w("K1", "blue", "蓝色", "🔵", "colors"),
  w("K1", "green", "绿色", "🟢", "colors"),
  w("K1", "yellow", "黄色", "🟡", "colors"),
  w("K1", "orange", "橙色", "🟠", "colors"),
  w("K1", "purple", "紫色", "🟣", "colors"),
  w("K1", "pink", "粉色", "🌸", "colors"),
  w("K1", "black", "黑色", "⚫", "colors"),
  w("K1", "white", "白色", "⚪", "colors"),
  w("K1", "brown", "棕色", "🟤", "colors"),
  // K1 — numbers
  w("K1", "one", "一", "1️⃣", "numbers"),
  w("K1", "two", "二", "2️⃣", "numbers"),
  w("K1", "three", "三", "3️⃣", "numbers"),
  w("K1", "four", "四", "4️⃣", "numbers"),
  w("K1", "five", "五", "5️⃣", "numbers"),
  w("K1", "six", "六", "6️⃣", "numbers"),
  w("K1", "seven", "七", "7️⃣", "numbers"),
  w("K1", "eight", "八", "8️⃣", "numbers"),
  w("K1", "nine", "九", "9️⃣", "numbers"),
  w("K1", "ten", "十", "🔟", "numbers"),
  // K1 — family
  w("K1", "mom", "妈妈", "👩", "family"),
  w("K1", "dad", "爸爸", "👨", "family"),
  w("K1", "baby", "宝宝", "👶", "family"),
  w("K1", "sister", "姐妹", "👧", "family"),
  w("K1", "brother", "兄弟", "👦", "family"),
  w("K1", "grandma", "奶奶", "👵", "family"),
  w("K1", "grandpa", "爷爷", "👴", "family"),
  // K1 — body
  w("K1", "hand", "手", "✋", "body"),
  w("K1", "foot", "脚", "🦶", "body"),
  w("K1", "eye", "眼睛", "👁️", "body"),
  w("K1", "ear", "耳朵", "👂", "body"),
  w("K1", "nose", "鼻子", "👃", "body"),
  w("K1", "mouth", "嘴巴", "👄", "body"),
  w("K1", "hair", "头发", "💇", "body"),
  w("K1", "tooth", "牙齿", "🦷", "body"),

  // K2 — animals
  w("K2", "cat", "猫", "🐱", "animals"),
  w("K2", "dog", "狗", "🐶", "animals"),
  w("K2", "pig", "猪", "🐷", "animals"),
  w("K2", "cow", "奶牛", "🐮", "animals"),
  w("K2", "duck", "鸭子", "🦆", "animals"),
  w("K2", "frog", "青蛙", "🐸", "animals"),
  w("K2", "bird", "鸟", "🐦", "animals"),
  w("K2", "bee", "蜜蜂", "🐝", "animals"),
  w("K2", "fish", "鱼", "🐟", "animals"),
  w("K2", "horse", "马", "🐴", "animals"),
  // K2 — food
  w("K2", "apple", "苹果", "🍎", "food"),
  w("K2", "banana", "香蕉", "🍌", "food"),
  w("K2", "milk", "牛奶", "🥛", "food"),
  w("K2", "bread", "面包", "🍞", "food"),
  w("K2", "rice", "米饭", "🍚", "food"),
  w("K2", "egg", "鸡蛋", "🥚", "food"),
  w("K2", "cake", "蛋糕", "🎂", "food"),
  w("K2", "candy", "糖果", "🍬", "food"),
  // K2 — toys
  w("K2", "ball", "球", "⚽", "toys"),
  w("K2", "doll", "娃娃", "🪆", "toys"),
  w("K2", "kite", "风筝", "🪁", "toys"),
  w("K2", "blocks", "积木", "🧱", "toys"),
  w("K2", "teddy", "泰迪熊", "🧸", "toys"),
  w("K2", "drum", "鼓", "🥁", "toys"),
  // K2 — actions
  w("K2", "run", "跑", "🏃", "actions"),
  w("K2", "jump", "跳", "🤸", "actions"),
  w("K2", "walk", "走", "🚶", "actions"),
  w("K2", "sit", "坐", "🪑", "actions"),
  w("K2", "clap", "拍手", "👏", "actions"),
  w("K2", "sleep", "睡觉", "😴", "actions"),

  // K3 — school
  w("K3", "book", "书", "📖", "school"),
  w("K3", "pen", "钢笔", "🖊️", "school"),
  w("K3", "pencil", "铅笔", "✏️", "school"),
  w("K3", "bag", "书包", "🎒", "school"),
  w("K3", "desk", "书桌", "🗄️", "school"),
  w("K3", "ruler", "尺子", "📏", "school"),
  w("K3", "crayon", "蜡笔", "🖍️", "school"),
  // K3 — weather
  w("K3", "sun", "太阳", "☀️", "weather"),
  w("K3", "rain", "雨", "🌧️", "weather"),
  w("K3", "snow", "雪", "❄️", "weather"),
  w("K3", "wind", "风", "🌬️", "weather"),
  w("K3", "cloud", "云", "☁️", "weather"),
  w("K3", "rainbow", "彩虹", "🌈", "weather"),
  w("K3", "storm", "暴风雨", "⛈️", "weather"),
  // K3 — clothes
  w("K3", "shirt", "衬衫", "👕", "clothes"),
  w("K3", "pants", "裤子", "👖", "clothes"),
  w("K3", "shoes", "鞋子", "👟", "clothes"),
  w("K3", "hat", "帽子", "🎩", "clothes"),
  w("K3", "socks", "袜子", "🧦", "clothes"),
  w("K3", "coat", "外套", "🧥", "clothes"),
  w("K3", "dress", "裙子", "👗", "clothes"),
  // K3 — daily items
  w("K3", "cup", "杯子", "☕", "daily"),
  w("K3", "spoon", "勺子", "🥄", "daily"),
  w("K3", "fork", "叉子", "🍴", "daily"),
  w("K3", "plate", "盘子", "🍽️", "daily"),
  w("K3", "key", "钥匙", "🔑", "daily"),
  w("K3", "clock", "时钟", "🕐", "daily"),
  w("K3", "door", "门", "🚪", "daily"),
  w("K3", "bed", "床", "🛏️", "daily"),
];
