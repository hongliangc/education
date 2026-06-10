// Grade Three vocabulary (~300 cumulative target) — space, science, body systems, community
// roles, school subjects and more abstract concept words. Self-contained data leaf: the only
// import is the erased `GradedWord` type, so the Node test runner loads it directly.
import type { GradedWord } from "../words";

function w(en: string, zh: string, emoji: string, category: string): GradedWord {
  return { id: `g3-${en.replace(/\s+/g, "-")}`, grade: "G3", en, zh, emoji, category };
}

export const GRADE_THREE_WORDS: GradedWord[] = [
  // space
  w("planet", "行星", "🪐", "space"),
  w("earth", "地球", "🌍", "space"),
  w("space", "太空", "🌌", "space"),
  w("rocket", "火箭", "🚀", "space"),
  w("alien", "外星人", "👽", "space"),
  w("comet", "彗星", "☄️", "space"),
  w("galaxy", "星系", "🌠", "space"),
  w("telescope", "望远镜", "🔭", "space"),
  // science & nature
  w("volcano", "火山", "🌋", "science"),
  w("desert", "沙漠", "🏜️", "science"),
  w("forest", "森林", "🌲", "science"),
  w("ocean", "海洋", "🌊", "science"),
  w("jungle", "丛林", "🌴", "science"),
  w("glacier", "冰川", "🧊", "science"),
  w("fossil", "化石", "🦴", "science"),
  w("magnet", "磁铁", "🧲", "science"),
  w("crystal", "水晶", "💎", "science"),
  w("dinosaur", "恐龙", "🦕", "science"),
  // body systems
  w("heart", "心脏", "❤️", "body"),
  w("brain", "大脑", "🧠", "body"),
  w("bone", "骨头", "🦴", "body"),
  w("muscle", "肌肉", "💪", "body"),
  w("blood", "血液", "🩸", "body"),
  w("lung", "肺", "🫁", "body"),
  w("skin", "皮肤", "🧴", "body"),
  w("stomach", "胃", "🤰", "body"),
  // community roles
  w("scientist", "科学家", "🧑‍🔬", "community"),
  w("engineer", "工程师", "🧑‍🔧", "community"),
  w("dentist", "牙医", "🦷", "community"),
  w("lawyer", "律师", "⚖️", "community"),
  w("sailor", "水手", "⚓", "community"),
  w("soldier", "士兵", "🪖", "community"),
  w("judge", "法官", "👨‍⚖️", "community"),
  w("writer", "作家", "🖋️", "community"),
  // school subjects
  w("math", "数学", "➗", "subjects"),
  w("science", "科学", "🔬", "subjects"),
  w("history", "历史", "📜", "subjects"),
  w("music", "音乐", "🎼", "subjects"),
  w("art", "美术", "🎨", "subjects"),
  w("reading", "阅读", "📚", "subjects"),
  w("spelling", "拼写", "🔤", "subjects"),
  // adjectives
  w("brave", "勇敢", "🦸", "adjectives"),
  w("kind", "善良", "🤗", "adjectives"),
  w("clever", "聪明", "🧠", "adjectives"),
  w("gentle", "温柔", "🕊️", "adjectives"),
  w("strong", "强壮", "🏋️", "adjectives"),
  w("weak", "虚弱", "🪶", "adjectives"),
  w("heavy", "重", "🏋️", "adjectives"),
  w("light", "轻", "🎈", "adjectives"),
  w("clean", "干净", "🧼", "adjectives"),
  w("dirty", "脏", "🧹", "adjectives"),
  w("quiet", "安静", "🤫", "adjectives"),
  w("loud", "吵闹", "📢", "adjectives"),
  // verbs
  w("build", "建造", "🏗️", "verbs"),
  w("paint", "涂", "🎨", "verbs"),
  w("measure", "测量", "📐", "verbs"),
  w("invent", "发明", "💡", "verbs"),
  w("explore", "探索", "🧭", "verbs"),
  w("discover", "发现", "🔎", "verbs"),
  w("imagine", "想象", "💭", "verbs"),
  w("create", "创造", "🛠️", "verbs"),
  w("repair", "修理", "🔧", "verbs"),
  w("observe", "观察", "👀", "verbs"),
  // abstract & feelings
  w("dream", "梦想", "💫", "abstract"),
  w("idea", "主意", "💡", "abstract"),
  w("hope", "希望", "🌟", "abstract"),
  w("fear", "恐惧", "😱", "abstract"),
  w("joy", "喜悦", "😊", "abstract"),
  w("pride", "骄傲", "🦚", "abstract"),
  w("peace", "和平", "🕊️", "abstract"),
  w("courage", "勇气", "🛡️", "abstract"),
  // geography
  w("country", "国家", "🌐", "geography"),
  w("city", "城市", "🏙️", "geography"),
  w("village", "村庄", "🏘️", "geography"),
  w("capital", "首都", "🏛️", "geography"),
  w("border", "边界", "🚧", "geography"),
  w("valley", "山谷", "🏞️", "geography"),
  w("harbor", "港口", "⚓", "geography"),
  w("bridge", "桥", "🌉", "geography"),
  // seasons
  w("spring", "春天", "🌸", "seasons"),
  w("summer", "夏天", "🏖️", "seasons"),
  w("autumn", "秋天", "🍂", "seasons"),
  w("winter", "冬天", "⛄", "seasons"),
  w("season", "季节", "🔄", "seasons"),
];
