import { pinyin } from "pinyin-pro";
// @ts-expect-error Node's native TypeScript tests require the explicit extension.
import { EXPANDED_HANZI_SEEDS, HSK_WORDS_BY_CHAR } from "./expanded-catalog.ts";

export const HANZI_LEVELS = ["G1", "G2", "G3", "G4", "G5", "G6"] as const;
export type PrimaryGradeLevel = (typeof HANZI_LEVELS)[number];

export interface HanziItem {
  id: string;
  level: PrimaryGradeLevel;
  char: string;
  pinyin: string;
  meaning: string;
  words: readonly string[];
  story: string;
  tags: readonly string[];
  groupId: string;
  groupTitle: string;
  groupPhrase: string;
  groupOrder: number;
  charOrder: number;
}

export interface HanziMemoryGroup {
  id: string;
  level: PrimaryGradeLevel;
  title: string;
  phrase: string;
  chars: readonly string[];
}

const CORE_HANZI_MEMORY_GROUPS: readonly HanziMemoryGroup[] = [
  group("G1", "numbers", "数字歌", "一二三四五六七八九十", "一二三四五六七八九十"),
  group("G1", "people", "身体朋友", "人口手足耳目牙", "人口"),
  group("G1", "nature-base", "自然小景", "日月水火山木田土", "日月水火山木田土"),
  group("G1", "direction-base", "方向词", "上下左右东西南北", "上下左右"),
  group("G1", "size-count", "大小多少", "大小多少中", "大小多少中"),

  group("G2", "sky-weather", "天空天气", "天云风雨雪", "天云风雨雪"),
  group("G2", "plants-animals", "花草虫鱼鸟马牛羊", "花草虫鱼鸟马牛羊", "花草虫鱼鸟马牛羊"),
  group("G2", "body", "身体五官", "手足耳目牙", "手足耳目牙"),
  group("G2", "home-school", "家门车船学校", "家门车船学校", "门车船家学校"),

  group("G3", "seasons", "四季轮转", "春夏秋冬", "春夏秋冬"),
  group("G3", "direction-full", "方向词", "上下左右东西南北", "东西南北"),
  group("G3", "space-time", "前后里外早晚", "前后里外早晚", "前后里外早晚"),
  group("G3", "bright-sound", "明亮声音", "明亮声音", "明亮声音"),
  group("G3", "school-friends", "朋友老师同学书笔", "朋友老师同学书笔", "朋友老师同学书笔"),

  group("G4", "home-country", "国家城乡", "国城村河海", "国城村河海"),
  group("G4", "forest-light", "森林星光电气", "森林星光电气", "森林星光电气"),
  group("G4", "mood", "快乐安静勇敢", "快乐安静勇敢", "快乐安静勇敢"),
  group("G4", "help-learn", "帮助学习语言", "帮助学习语言", "帮助学习语言"),

  group("G5", "healthy-body", "身体健康", "身体健康运动比赛", "身体健康运动比赛"),
  group("G5", "arts", "故事音乐颜色形状", "故事音乐颜色形状", "故事音乐颜色形状"),
  group("G5", "calendar", "方向时间节日祖先", "方向时间节日祖先", "方向时间节日祖先"),

  group("G6", "thinking", "观察想象发现创造", "观察想象发现创造", "观察想象发现创造"),
  group("G6", "earth", "保护环境责任合作", "保护环境责任合作", "保护环境责任合作"),
  group("G6", "future", "坚持希望梦愿世界未来", "坚持希望梦愿世界未来", "坚持希望梦愿世界未来"),
] as const;

export const HANZI_MEMORY_GROUPS: readonly HanziMemoryGroup[] = [
  ...CORE_HANZI_MEMORY_GROUPS,
  ...expandedMemoryGroups(),
];

const LEVEL_CHARS: Record<PrimaryGradeLevel, readonly string[]> = {
  G1: charsForLevel("G1"),
  G2: charsForLevel("G2"),
  G3: charsForLevel("G3"),
  G4: charsForLevel("G4"),
  G5: charsForLevel("G5"),
  G6: charsForLevel("G6"),
};

const DETAILS: Record<string, { meaning: string; words: readonly string[]; story: string; tags: readonly string[] }> = {
  一: { meaning: "数字一", words: ["一个", "第一"], story: "一横像小路，稳稳向前走。", tags: ["number"] },
  二: { meaning: "数字二", words: ["二月", "二人"], story: "两条横线排排站，上短下长更漂亮。", tags: ["number"] },
  三: { meaning: "数字三", words: ["三天", "三只"], story: "三条横线像台阶，一步一步往上爬。", tags: ["number"] },
  人: { meaning: "人", words: ["大人", "人民"], story: "一撇一捺像两条腿，站得稳稳的。", tags: ["body"] },
  口: { meaning: "嘴巴", words: ["口水", "门口"], story: "小方框张开口，可以说话也能唱歌。", tags: ["body"] },
  日: { meaning: "太阳", words: ["日子", "生日"], story: "太阳住进小窗格，天天给我们光。", tags: ["nature"] },
  月: { meaning: "月亮", words: ["月亮", "月牙"], story: "弯弯月亮挂天空，夜里陪你做美梦。", tags: ["nature"] },
  水: { meaning: "水", words: ["喝水", "河水"], story: "水流弯弯跑得快，洗手喝水都要它。", tags: ["nature"] },
  火: { meaning: "火", words: ["火山", "火光"], story: "小火苗跳呀跳，靠近它要小心。", tags: ["nature"] },
  山: { meaning: "高山", words: ["大山", "山上"], story: "三个山尖连一起，远远看见高高山。", tags: ["nature"] },
};

const RAW_HANZI_CATALOG: readonly HanziItem[] = HANZI_MEMORY_GROUPS.flatMap(
  (memoryGroup, groupOrder) =>
    memoryGroup.chars.map((char, charOrder) => buildItem(memoryGroup, char, groupOrder, charOrder)),
);

export const HANZI_CATALOG: readonly HanziItem[] = RAW_HANZI_CATALOG.filter(
  (item, index, items) => items.findIndex((candidate) => candidate.char === item.char) === index,
);

function buildItem(
  memoryGroup: HanziMemoryGroup,
  char: string,
  groupOrder: number,
  charOrder: number,
): HanziItem {
  const detail = DETAILS[char] ?? expandedDetail(char);
  return {
    id: `hanzi:${char}`,
    level: memoryGroup.level,
    char,
    pinyin: pinyin(char, { toneType: "symbol" }),
    groupId: `${memoryGroup.level}-${memoryGroup.id}`,
    groupTitle: memoryGroup.title,
    groupPhrase: memoryGroup.phrase,
    groupOrder,
    charOrder,
    ...detail,
  };
}

function group(
  level: PrimaryGradeLevel,
  id: string,
  title: string,
  phrase: string,
  chars: string,
): HanziMemoryGroup {
  return { level, id, title, phrase, chars: [...chars] };
}

function charsForLevel(level: PrimaryGradeLevel): string[] {
  return HANZI_MEMORY_GROUPS.filter((memoryGroup) => memoryGroup.level === level).flatMap(
    (memoryGroup) => memoryGroup.chars,
  );
}

function expandedDetail(char: string): {
  meaning: string;
  words: readonly string[];
  story: string;
  tags: readonly string[];
} {
  const words = HSK_WORDS_BY_CHAR[char];
  if (!words || words.length < 2) throw new Error(`Missing real learning words for ${char}`);
  return {
    meaning: `常见于“${words.slice(0, 2).join("、")}”`,
    words,
    story: `读一读“${words[0]}”和“${words[1]}”，找一找里面的“${char}”。`,
    tags: ["common"],
  };
}

function expandedMemoryGroups(): HanziMemoryGroup[] {
  const result: HanziMemoryGroup[] = [];
  for (const level of HANZI_LEVELS) {
    const seeds = EXPANDED_HANZI_SEEDS.filter((seed) => seed.level === level);
    for (let index = 0; index < seeds.length; index += 12) {
      const chars = seeds.slice(index, index + 12).map((seed) => seed.char);
      const part = Math.floor(index / 12) + 1;
      result.push(group(level, `practical-${part}`, `生活常用字 ${part}`, chars.join(""), chars.join("")));
    }
  }
  return result;
}
