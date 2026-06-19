export type PhonemeKind = "vowel" | "consonant";
export type PhonemeGroup =
  | "长元音"
  | "短元音"
  | "双元音"
  | "爆破音"
  | "摩擦音"
  | "破擦音"
  | "鼻音"
  | "半元音";

export interface PhonemeExample {
  word: string;
  emoji: string;
  zh: string;
}

export interface Phoneme {
  id: string;
  symbol: string;
  kind: PhonemeKind;
  group: PhonemeGroup;
  examples: readonly PhonemeExample[];
  alliteration: string;
  /** TTS 能念出的「单独示范该音素」近似念法（IPA 无法直接合成，故用可朗读近似）。 */
  say: string;
}

export interface GroupInfo {
  group: PhonemeGroup;
  chant: string;
  story: string;
}

export const IPA_GROUPS: readonly PhonemeGroup[] = [
  "长元音",
  "短元音",
  "双元音",
  "爆破音",
  "摩擦音",
  "破擦音",
  "鼻音",
  "半元音",
];

// 「单独示范音素」的 TTS 念法（美式英语 en-US），按音素 id 查，由浏览器原生英文音色朗读。
// 原则：能用近似拼读稳定念出的（多数辅音「子音+schwa」、清晰长元音）用近似；TTS 无法孤立
// 念准的松元音/双元音/破擦音（/ɪ/ /ʊ/ /æ/ /eɪ/ /ʊə/ /ʒ/ /ts/ /dz/）改用清晰的美式关键词
// （真实单词必然念对，且明显含该音）。可按真人听感继续微调。
const PHONEME_SAY: Record<string, string> = {
  "long-i": "ee",
  "long-er": "er",
  "long-a": "are", // /ɑr/（美式 r 化，如 car/arm；与字母 R 同音）
  "long-or": "or",
  "long-u": "oo",
  "short-i": "it", // /ɪ/（原 "ih" 念不准）
  "short-e": "eh",
  "short-a": "at", // /æ/（原 "ah" 与长元音 /ɑː/ 混同，念成"啊"）
  schwa: "uh",
  "short-u": "uh",
  "short-o": "ah", // /ɑ/（美式短 o，如 box/dog）
  "short-oo": "book", // /ʊ/（原 "uu" 念不准；/ʊ/ 不单独出现在词首）
  "diphthong-ai": "eigh", // /eɪ/（原 "ay" 念不准，与字母 A 同改）
  "diphthong-eye": "eye",
  "diphthong-oy": "oy",
  "diphthong-ear": "ear",
  "diphthong-air": "air",
  "diphthong-tour": "tour", // /ʊə/（原 "oor" 念不准）
  "diphthong-oh": "oh",
  "diphthong-ow": "ow",
  p: "puh",
  b: "buh",
  t: "tuh",
  d: "duh",
  k: "kuh",
  g: "guh",
  f: "fuh",
  v: "vuh",
  s: "suh",
  z: "zuh",
  theta: "thuh",
  eth: "thuh",
  sh: "sh",
  zh: "vision", // /ʒ/（原 "zhuh" 念不准；/ʒ/ 多出现在词中）
  h: "huh",
  r: "ruh",
  ch: "chuh",
  j: "juh",
  tr: "truh",
  dr: "druh",
  ts: "cats", // /ts/（原 "tsuh" 念不准；/ts/ 多在词尾，如 cats）
  dz: "kids", // /dz/（原 "dzuh" 念不准；/dz/ 多在词尾，如 kids）
  m: "muh",
  n: "nuh",
  ng: "ung",
  y: "yuh",
  w: "wuh",
  l: "luh",
};

const phoneme = (
  id: string,
  symbol: string,
  kind: PhonemeKind,
  group: PhonemeGroup,
  examples: readonly PhonemeExample[],
  alliteration: string,
): Phoneme => ({ id, symbol, kind, group, examples, alliteration, say: PHONEME_SAY[id] ?? "" });

const example = (word: string, emoji: string, zh: string): PhonemeExample => ({
  word,
  emoji,
  zh,
});

export const IPA_PHONEMES: readonly Phoneme[] = [
  phoneme("long-i", "/i/", "vowel", "长元音", [example("see", "👀", "看见"), example("tea", "🫖", "茶")], "See the green tree"),
  phoneme("long-er", "/ɝ/", "vowel", "长元音", [example("bird", "🐦", "鸟"), example("girl", "👧", "女孩")], "Birds turn in circles"),
  phoneme("long-a", "/ɑr/", "vowel", "长元音", [example("car", "🚗", "汽车"), example("arm", "💪", "手臂")], "Cars park by barns"),
  phoneme("long-or", "/ɔ/", "vowel", "长元音", [example("ball", "⚽", "球"), example("door", "🚪", "门")], "Small horses draw chalk"),
  phoneme("long-u", "/u/", "vowel", "长元音", [example("moon", "🌙", "月亮"), example("blue", "🔵", "蓝色")], "Blue moons move smoothly"),

  phoneme("short-i", "/ɪ/", "vowel", "短元音", [example("sit", "🪑", "坐"), example("pig", "🐷", "猪")], "Little pigs sit still"),
  phoneme("short-e", "/ɛ/", "vowel", "短元音", [example("egg", "🥚", "鸡蛋"), example("bed", "🛏️", "床")], "Red hens get eggs"),
  phoneme("short-a", "/æ/", "vowel", "短元音", [example("apple", "🍎", "苹果"), example("cat", "🐱", "猫")], "Happy cats catch apples"),
  phoneme("schwa", "/ə/", "vowel", "短元音", [example("banana", "🍌", "香蕉"), example("sofa", "🛋️", "沙发")], "A banana and a panda"),
  phoneme("short-u", "/ʌ/", "vowel", "短元音", [example("cup", "☕", "杯子"), example("sun", "☀️", "太阳")], "Funny ducks jump up"),
  phoneme("short-o", "/ɑ/", "vowel", "短元音", [example("dog", "🐶", "狗"), example("box", "📦", "盒子")], "Hot dogs hop on boxes"),
  phoneme("short-oo", "/ʊ/", "vowel", "短元音", [example("book", "📖", "书"), example("foot", "🦶", "脚")], "Good cooks look at books"),

  phoneme("diphthong-ai", "/eɪ/", "vowel", "双元音", [example("cake", "🎂", "蛋糕"), example("rain", "🌧️", "雨")], "Gray snails play games"),
  phoneme("diphthong-eye", "/aɪ/", "vowel", "双元音", [example("kite", "🪁", "风筝"), example("ice", "🧊", "冰")], "My nice kite flies high"),
  phoneme("diphthong-oy", "/ɔɪ/", "vowel", "双元音", [example("boy", "👦", "男孩"), example("toy", "🧸", "玩具")], "Joyful boys enjoy toys"),
  phoneme("diphthong-ear", "/ɪr/", "vowel", "双元音", [example("ear", "👂", "耳朵"), example("deer", "🦌", "鹿")], "Cheerful deer peer near"),
  phoneme("diphthong-air", "/ɛr/", "vowel", "双元音", [example("hair", "💇", "头发"), example("bear", "🐻", "熊")], "Fair bears share pears"),
  phoneme("diphthong-tour", "/ʊr/", "vowel", "双元音", [example("tour", "🧳", "旅行"), example("sure", "👍", "当然")], "Tourists tour a pure moor"),
  phoneme("diphthong-oh", "/oʊ/", "vowel", "双元音", [example("nose", "👃", "鼻子"), example("boat", "⛵", "小船")], "Old goats row home"),
  phoneme("diphthong-ow", "/aʊ/", "vowel", "双元音", [example("cow", "🐄", "奶牛"), example("house", "🏠", "房子")], "Brown cows crowd houses"),

  phoneme("p", "/p/", "consonant", "爆破音", [example("pig", "🐷", "猪")], "Puppies play pink pianos"),
  phoneme("b", "/b/", "consonant", "爆破音", [example("ball", "⚽", "球")], "Big bears bake bread"),
  phoneme("t", "/t/", "consonant", "爆破音", [example("tiger", "🐯", "老虎")], "Tiny tigers take ten"),
  phoneme("d", "/d/", "consonant", "爆破音", [example("dog", "🐶", "狗")], "Daddy dogs dance daily"),
  phoneme("k", "/k/", "consonant", "爆破音", [example("cat", "🐱", "猫"), example("kite", "🪁", "风筝")], "Kind cats cook cakes"),
  phoneme("g", "/g/", "consonant", "爆破音", [example("goat", "🐐", "山羊")], "Green goats grow grapes"),

  phoneme("f", "/f/", "consonant", "摩擦音", [example("fish", "🐟", "鱼")], "Funny frogs find food"),
  phoneme("v", "/v/", "consonant", "摩擦音", [example("van", "🚐", "面包车")], "Violet vans visit villages"),
  phoneme("s", "/s/", "consonant", "摩擦音", [example("sun", "☀️", "太阳")], "Silly snakes sip soup"),
  phoneme("z", "/z/", "consonant", "摩擦音", [example("zebra", "🦓", "斑马")], "Zippy zebras zoom zigzags"),
  phoneme("theta", "/θ/", "consonant", "摩擦音", [example("thumb", "👍", "拇指"), example("three", "3️⃣", "三")], "Three thin thumbs thump"),
  phoneme("eth", "/ð/", "consonant", "摩擦音", [example("this", "👉", "这个"), example("mother", "👩", "妈妈")], "This mother gathers feathers"),
  phoneme("sh", "/ʃ/", "consonant", "摩擦音", [example("ship", "🚢", "轮船"), example("fish", "🐟", "鱼")], "Shy sheep share shoes"),
  phoneme("zh", "/ʒ/", "consonant", "摩擦音", [example("television", "📺", "电视")], "Television treasures measure pleasure"),
  phoneme("h", "/h/", "consonant", "摩擦音", [example("hat", "🎩", "帽子")], "Happy hippos hug hats"),
  phoneme("r", "/ɹ/", "consonant", "摩擦音", [example("rabbit", "🐰", "兔子")], "Red rabbits race round"),

  phoneme("ch", "/tʃ/", "consonant", "破擦音", [example("chair", "🪑", "椅子")], "Cheerful children chase chickens"),
  phoneme("j", "/dʒ/", "consonant", "破擦音", [example("juice", "🧃", "果汁"), example("jam", "🍓", "果酱")], "Jolly giants juggle juice"),
  phoneme("tr", "/tr/", "consonant", "破擦音", [example("tree", "🌳", "树")], "Tiny trains travel tracks"),
  phoneme("dr", "/dr/", "consonant", "破擦音", [example("drum", "🥁", "鼓")], "Drowsy dragons drive drums"),
  phoneme("ts", "/ts/", "consonant", "破擦音", [example("cats", "🐱", "猫（复数）")], "Cats sit on mats"),
  phoneme("dz", "/dz/", "consonant", "破擦音", [example("birds", "🐦", "鸟（复数）")], "Birds feed kids seeds"),

  phoneme("m", "/m/", "consonant", "鼻音", [example("moon", "🌙", "月亮")], "Merry monkeys munch mangoes"),
  phoneme("n", "/n/", "consonant", "鼻音", [example("nest", "🪺", "鸟巢")], "Nine nurses need noodles"),
  phoneme("ng", "/ŋ/", "consonant", "鼻音", [example("king", "👑", "国王"), example("sing", "🎤", "唱歌")], "King is singing a song"),

  phoneme("y", "/j/", "consonant", "半元音", [example("yes", "✅", "是"), example("yo-yo", "🪀", "悠悠球")], "Yellow yaks yell yes"),
  phoneme("w", "/w/", "consonant", "半元音", [example("whale", "🐳", "鲸鱼"), example("water", "💧", "水")], "Wet whales wash windows"),
  phoneme("l", "/l/", "consonant", "半元音", [example("lion", "🦁", "狮子")], "Little lions love lemons"),
];

export const IPA_GROUP_INFO: Record<PhonemeGroup, GroupInfo> = {
  长元音: {
    group: "长元音",
    chant: "五个长元音，嘴形稳稳声音长。",
    story: "我 see 到一只 bird 坐上 car，追着 ball 一直跑到 moon 旁。",
  },
  短元音: {
    group: "短元音",
    chant: "七个短元音，短短脆脆快收声。",
    story: "小猪先 sit 下，拿着 egg 和 apple，吃完 banana，用 cup 喂 dog，再一起看 book。",
  },
  双元音: {
    group: "双元音",
    chant: "八个双元音，嘴形滑动连成音。",
    story: "带上 cake 和 kite，男孩 boy 竖起 ear，理好 hair 去 tour，用 nose 找到 cow。",
  },
  爆破音: {
    group: "爆破音",
    chant: "六个爆破音，气先关住再放松。",
    story: "一只 pig 踢着 ball，遇见 tiger 和 dog，又叫上 cat 去看 goat。",
  },
  摩擦音: {
    group: "摩擦音",
    chant: "十个摩擦音，气流窄缝擦出声。",
    story: "fish 坐上 van 追 sun，路过 zebra 和 thumb，指着 this ship、television、hat 与 rabbit。",
  },
  破擦音: {
    group: "破擦音",
    chant: "六个破擦音，先堵后擦连着冲。",
    story: "chair 上放着 juice，tree 下的 drum 一响，cats 和 birds 都来跳舞。",
  },
  鼻音: {
    group: "鼻音",
    chant: "三个鼻音齐声哼，气流都从鼻子行。",
    story: "moon 下有一个 nest，里面住着会唱歌的 king。",
  },
  半元音: {
    group: "半元音",
    chant: "三个半元音，滑向元音轻又灵。",
    story: "我说 yes，whale 就载着 lion 去远航。",
  },
};

export function phonemesInGroup(group: PhonemeGroup): Phoneme[] {
  return IPA_PHONEMES.filter((item) => item.group === group);
}

export function exampleWords(phonemeItem: Phoneme): string[] {
  return phonemeItem.examples.map((item) => item.word);
}

export function groupInfo(group: PhonemeGroup): GroupInfo {
  return IPA_GROUP_INFO[group];
}
