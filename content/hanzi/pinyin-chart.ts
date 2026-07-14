export type PinyinCategory = "initial" | "simple-final" | "compound-final" | "nasal-final" | "whole-syllable";

export interface PinyinChartItem {
  id: string;
  display: string;
  category: PinyinCategory;
  mouthHint: string;
  exampleChar: string;
  exampleWord: string;
  ssml: string;
  lessonSsml: string;
  fallback: string;
  phoneme: string;
  phonemeBase: string;
}

type Seed = readonly [display: string, ph: string, soundText: string, exampleChar: string, exampleWord: string];

const SEEDS: Record<PinyinCategory, readonly Seed[]> = {
  initial: [
    ["b", "bo1", "玻", "爸", "爸爸"], ["p", "po1", "坡", "跑", "跑步"], ["m", "mo1", "摸", "妈", "妈妈"], ["f", "fo1", "佛", "风", "大风"],
    ["d", "de1", "得", "大", "大人"], ["t", "te1", "特", "天", "天空"], ["n", "ne1", "呢", "你", "你好"], ["l", "le1", "勒", "乐", "快乐"],
    ["g", "ge1", "哥", "高", "高山"], ["k", "ke1", "科", "开", "开心"], ["h", "he1", "喝", "好", "好人"], ["j", "ji1", "鸡", "家", "大家"],
    ["q", "qi1", "七", "桥", "小桥"], ["x", "xi1", "西", "小", "小手"], ["zh", "zhi1", "知", "中", "中国"], ["ch", "chi1", "吃", "春", "春天"],
    ["sh", "shi1", "诗", "山", "高山"], ["r", "ri1", "日", "人", "大人"], ["z", "zi1", "资", "早", "早上"], ["c", "ci1", "词", "草", "小草"],
    ["s", "si1", "丝", "三", "三个"], ["y", "yi1", "衣", "一", "一个"], ["w", "wu1", "乌", "五", "五个"],
  ],
  "simple-final": [["a", "a1", "啊", "阿", "阿姨"], ["o", "o1", "喔", "哦", "哦哟"], ["e", "e1", "鹅", "鹅", "白鹅"], ["i", "yi1", "衣", "衣", "衣服"], ["u", "wu1", "乌", "乌", "乌云"], ["ü", "yu1", "鱼", "鱼", "小鱼"]],
  "compound-final": [["ai", "ai1", "哎", "爱", "爱心"], ["ei", "ei1", "诶", "杯", "水杯"], ["ui", "wei1", "威", "水", "喝水"], ["ao", "ao1", "凹", "猫", "小猫"], ["ou", "ou1", "欧", "狗", "小狗"], ["iu", "you1", "优", "六", "六个"], ["ie", "ye1", "耶", "叶", "树叶"], ["üe", "yue1", "约", "月", "月亮"], ["er", "er2", "儿", "耳", "耳朵"]],
  "nasal-final": [["an", "an1", "安", "山", "高山"], ["en", "en1", "恩", "门", "大门"], ["in", "yin1", "音", "心", "开心"], ["un", "wen1", "温", "春", "春天"], ["ün", "yun1", "晕", "云", "白云"], ["ang", "ang1", "肮", "羊", "小羊"], ["eng", "eng1", "鞥", "风", "大风"], ["ing", "ying1", "英", "星", "星星"], ["ong", "weng1", "翁", "东", "东方"]],
  "whole-syllable": [["zhi", "zhi1", "知", "知", "知道"], ["chi", "chi1", "吃", "吃", "吃饭"], ["shi", "shi1", "诗", "诗", "古诗"], ["ri", "ri1", "日", "日", "日子"], ["zi", "zi1", "资", "字", "汉字"], ["ci", "ci1", "词", "词", "词语"], ["si", "si1", "丝", "四", "四个"], ["yi", "yi1", "衣", "一", "一个"], ["wu", "wu1", "乌", "五", "五个"], ["yu", "yu1", "鱼", "鱼", "小鱼"], ["ye", "ye1", "耶", "叶", "树叶"], ["yue", "yue1", "约", "月", "月亮"], ["yuan", "yuan1", "渊", "圆", "圆形"], ["yin", "yin1", "音", "音", "音乐"], ["yun", "yun1", "晕", "云", "白云"], ["ying", "ying1", "英", "鹰", "老鹰"]],
};

const HINT: Record<PinyinCategory, string> = {
  initial: "先用清晰的教学读音认声母，真正拼读时要轻短。",
  "simple-final": "看清口型，声音响亮并保持不变。",
  "compound-final": "嘴形从第一个韵母滑向第二个韵母。",
  "nasal-final": "先读韵母，结尾让声音轻轻进入鼻腔。",
  "whole-syllable": "整体认读，不拆开拼，直接读出来。",
};

export const PINYIN_CHART: readonly PinyinChartItem[] = (Object.entries(SEEDS) as [PinyinCategory, readonly Seed[]][]).flatMap(([category, seeds]) =>
  seeds.map(([display, ph, soundText, exampleChar, exampleWord]) => {
    const phoneme = ph;
    return {
      id: `${category}-${display}`,
      display,
      category,
      mouthHint: HINT[category],
      exampleChar,
      exampleWord,
      ssml: `<speak><phoneme alphabet="py" ph="${phoneme}">${soundText}</phoneme></speak>`,
      lessonSsml: `<speak>${HINT[category]}<break time="300ms"/><phoneme alphabet="py" ph="${phoneme}">${soundText}</phoneme><break time="250ms"/><phoneme alphabet="py" ph="${phoneme}">${soundText}</phoneme></speak>`,
      fallback: soundText,
      phoneme,
      phonemeBase: phoneme.replace(/\d$/, ""),
    };
  }),
);
