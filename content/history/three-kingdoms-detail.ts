// content/history/three-kingdoms-detail.ts
// 三国「朝代详情页」内容数据（纯数据，无 React、无 @/）。
// 配套设计：wiki projects/mlk/specs/2026-06-27-history-three-kingdoms-detail-design.md
//
// 人物 key = ascii slug = public/history/three-kingdoms/people/<key>.webp 文件名；
// 核心人物(core:true) 的 key 与 content/storybooks/three-kingdoms.ts 各章 cardKeys 对齐，
// 由阅读进度派生「相识/了解」收集态（见 lib/history/threeKingdomsProgress.ts）。
// 本期为试点子集（~20/40），加数据行 + 重跑 scripts/optimize-three-kingdoms-art.mjs 即扩展。

export type FactionKey = "shu" | "wei" | "wu" | "qun";

export interface Faction {
  key: FactionKey;
  name: string; // 蜀汉 / 魏国 / 东吴 / 群雄
  short: string; // 蜀 / 魏 / 吴 / 雄
  color: string; // 阵营色令牌
  blurb: string; // 一句话
  mapArea: string; // 地图分区
}

export interface Person {
  key: string; // ascii slug == webp 文件名
  name: string;
  faction: FactionKey;
  role: string; // 一句话身份
  img: string; // 头像 webp
  core: boolean; // true=收集主角（随阅读点亮）；false=图鉴彩蛋
  // 仅核心人物的富卡内容：
  kidSummary?: string;
  stories?: string[]; // 名场面
  interact?: string; // 「如果你是…」互动问
}

export interface HistEvent {
  key: string;
  name: string;
  kidTitle: string; // 给孩子的悬念式小标题
  summary: string;
  img?: string; // 事件插图 webp（缺省用 emoji 兜底）
  emoji: string;
  // 挂章节 → 可点击进阅读闯关（锁定/可挑战/已通关由进度派生）；
  // 缺省 = 背景信息卡（恒显，不 gate）。
  chapterIdx?: number;
}

export type BadgeCondition =
  | { type: "chaptersAtLeast"; n: number }
  | { type: "chapterDone"; idx: number }
  | { type: "peopleKnownAtLeast"; n: number };

export interface Badge {
  key: string;
  title: string;
  icon: string; // emoji
  desc: string;
  condition: BadgeCondition;
}

export interface DynastyDetail {
  id: string;
  name: string;
  time: string;
  slogan: string;
  introForKids: string; // 一句话讲清
  keywords: string[]; // 3 个关键词
  // 3 个吊兴趣问题；每个直接指向能回答它的章节（点击进该章阅读，允许「先睹为快」跳读）
  openingQuestions: { q: string; chapterIdx: number }[];
  factions: Faction[];
  people: Person[];
  events: HistEvent[];
  badges: Badge[];
}

const pImg = (key: string): string => `/history/three-kingdoms/people/${key}.webp`;
const eImg = (key: string): string => `/history/three-kingdoms/events/${key}.webp`;

const FACTIONS: Faction[] = [
  { key: "shu", name: "蜀汉", short: "蜀", color: "#2E8B6B", blurb: "仁义立国，匡扶汉室", mapArea: "西南 · 益州" },
  { key: "wei", name: "魏国", short: "魏", color: "#2C4A7E", blurb: "雄踞北方，实力最强", mapArea: "北方 · 中原" },
  { key: "wu", name: "东吴", short: "吴", color: "#C2402F", blurb: "坐拥江东，水军称雄", mapArea: "东南 · 江东" },
  { key: "qun", name: "群雄", short: "雄", color: "#7C5CBF", blurb: "群雄并起，逐鹿天下", mapArea: "天下 · 各地" },
];

const PEOPLE: Person[] = [
  // ── 蜀汉（核心 5）────────────────────────────────────────────────
  {
    key: "liubei", name: "刘备", faction: "shu", role: "蜀汉的建立者", img: pImg("liubei"), core: true,
    kidSummary: "刘备本来只是个卖草鞋的人，但他特别重情义、会团结伙伴，最后建立了蜀汉。",
    stories: ["桃园三结义", "三顾茅庐", "白帝城托孤"],
    interact: "如果你是刘备，会不会三次去请诸葛亮帮忙？为什么？",
  },
  {
    key: "guanyu", name: "关羽", faction: "shu", role: "忠义无双的名将", img: pImg("guanyu"), core: true,
    kidSummary: "关羽武艺高强，最讲义气，答应过的事一定做到，后人都很敬佩他。",
    stories: ["桃园三结义", "过五关斩六将", "水淹七军"],
    interact: "朋友之间「讲义气」是什么意思？你做过守信用的事吗？",
  },
  {
    key: "zhangfei", name: "张飞", faction: "shu", role: "勇猛刚烈的猛将", img: pImg("zhangfei"), core: true,
    kidSummary: "张飞力气大、嗓门响，打仗特别勇敢，曾在长坂坡上一声大吼吓退敌军。",
    stories: ["桃园三结义", "长坂坡断后", "义释严颜"],
    interact: "张飞很勇敢，但脾气有点急。勇敢和冲动有什么不一样？",
  },
  {
    key: "zhugeliang", name: "诸葛亮", faction: "shu", role: "神机妙算的军师", img: pImg("zhugeliang"), core: true,
    kidSummary: "诸葛亮是三国最有名的军师，上知天文、下知地理，总能想出别人想不到的好办法。",
    stories: ["三顾茅庐", "草船借箭", "空城计", "七擒孟获"],
    interact: "诸葛亮靠观察和动脑筋取胜。遇到难题时，你会先做什么？",
  },
  {
    key: "zhaoyun", name: "赵云", faction: "shu", role: "一身是胆的常胜将军", img: pImg("zhaoyun"), core: true,
    kidSummary: "赵云又勇敢又冷静，曾在千军万马中救出小主人，被称作「一身是胆」。",
    stories: ["长坂坡救阿斗", "截江夺斗", "汉水之战"],
    interact: "在很危险的时候还能保持冷静，需要什么本领？",
  },
  // ── 蜀汉（图鉴）─────────────────────────────────────────────────
  { key: "machao", name: "马超", faction: "shu", role: "勇猛善战的「锦马超」", img: pImg("machao"), core: false },
  { key: "huangzhong", name: "黄忠", faction: "shu", role: "老当益壮的神射手", img: pImg("huangzhong"), core: false },
  // ── 魏国（核心 2）────────────────────────────────────────────────
  {
    key: "caocao", name: "曹操", faction: "wei", role: "雄才大略的北方霸主", img: pImg("caocao"), core: true,
    kidSummary: "曹操很聪明、很会用人，统一了北方，是三国里势力最强的一方。",
    stories: ["官渡之战", "挟天子以令诸侯", "煮酒论英雄"],
    interact: "曹操很会发现人才。你觉得一个好领袖最重要的本领是什么？",
  },
  {
    key: "simayi", name: "司马懿", faction: "wei", role: "能忍善谋的军师", img: pImg("simayi"), core: true,
    kidSummary: "司马懿很有耐心，懂得等待时机，最后他的家族统一了三国。",
    stories: ["空城计对峙", "抵御诸葛亮", "高平陵之变"],
    interact: "「等待时机」有时比马上行动更聪明。你能举个例子吗？",
  },
  // ── 魏国（图鉴）─────────────────────────────────────────────────
  { key: "guojia", name: "郭嘉", faction: "wei", role: "曹操最器重、可惜早逝的奇才谋士", img: pImg("guojia"), core: false },
  { key: "zhangliao", name: "张辽", faction: "wei", role: "威震逍遥津的魏国猛将", img: pImg("zhangliao"), core: false },
  // ── 东吴（核心 4）────────────────────────────────────────────────
  {
    key: "sunquan", name: "孙权", faction: "wu", role: "坐镇江东的年轻领袖", img: pImg("sunquan"), core: true,
    kidSummary: "孙权很年轻就接管了江东，他会用人、有决断，和刘备联手挡住了曹操。",
    stories: ["继承江东", "赤壁结盟", "联刘抗曹"],
    interact: "孙权决定和刘备联手对抗强大的曹操。为什么有时候要和别人合作？",
  },
  {
    key: "zhouyu", name: "周瑜", faction: "wu", role: "赤壁火攻的统帅", img: pImg("zhouyu"), core: true,
    kidSummary: "周瑜年轻有才，是东吴的大都督，他在赤壁用火攻打败了曹操的大军。",
    stories: ["赤壁之战", "火攻破曹", "智算曹军"],
    interact: "如果你是周瑜，面对人多势众的敌人，你会想什么办法？",
  },
  {
    key: "lusu", name: "鲁肃", faction: "wu", role: "顾全大局的外交家", img: pImg("lusu"), core: true,
    kidSummary: "鲁肃为人厚道、看得长远，是他极力主张孙刘联合，一起对抗曹操。",
    stories: ["主张联刘", "草船借箭借船", "单刀赴会"],
    interact: "鲁肃总想着「大局」。和小伙伴闹矛盾时，怎样才算顾全大局？",
  },
  {
    key: "huanggai", name: "黄盖", faction: "wu", role: "东吴的忠勇老将", img: pImg("huanggai"), core: true,
    kidSummary: "黄盖是东吴的老将军，为了火攻成功，他甘愿用「苦肉计」骗过曹操。",
    stories: ["赤壁苦肉计", "诈降曹操", "火船破敌"],
    interact: "黄盖为了大家愿意吃苦。你愿意为团队做出一点牺牲吗？",
  },
  // ── 东吴（图鉴）─────────────────────────────────────────────────
  { key: "sunce", name: "孙策", faction: "wu", role: "打下江东基业的「小霸王」", img: pImg("sunce"), core: false },
  { key: "luxun", name: "陆逊", faction: "wu", role: "火烧连营的书生统帅", img: pImg("luxun"), core: false },
  // ── 群雄（图鉴）─────────────────────────────────────────────────
  { key: "lvbu", name: "吕布", faction: "qun", role: "「人中吕布，马中赤兔」的第一猛将", img: pImg("lvbu"), core: false },
  { key: "diaochan", name: "貂蝉", faction: "qun", role: "连环计里智斗董卓的奇女子", img: pImg("diaochan"), core: false },
  { key: "dongzhuo", name: "董卓", faction: "qun", role: "祸乱朝纲的凶暴权臣", img: pImg("dongzhuo"), core: false },
];

// 大致按时间排序；img 有则配插图，chapterIdx 有则可进阅读闯关。
const EVENTS: HistEvent[] = [
  { key: "huangjin", name: "黄巾起义", kidTitle: "天下为什么乱了？", emoji: "🌾", img: eImg("huangjin"),
    summary: "东汉末年百姓生活困难，黄巾起义爆发，天下大乱，英雄们陆续登场。" },
  { key: "taoyuan", name: "桃园三结义", kidTitle: "三个好汉怎样成了兄弟？", emoji: "🌸", chapterIdx: 0,
    summary: "刘备、关羽、张飞在桃花园里结为兄弟，立志一起做一件大事。" },
  { key: "lianhuanji", name: "连环计", kidTitle: "怎样除掉凶暴的董卓？", emoji: "🎭", img: eImg("lianhuanji"),
    summary: "王允和貂蝉用「连环计」，巧妙离间了董卓和吕布，除掉了这个大坏蛋。" },
  { key: "zhujiu", name: "煮酒论英雄", kidTitle: "谁才是真正的英雄？", emoji: "🍶", img: eImg("zhujiulunyingxiong"),
    summary: "曹操请刘备喝酒，说「天下英雄只有你我」，刘备机智地掩饰了过去。" },
  { key: "sangu", name: "三顾茅庐", kidTitle: "刘备为什么三次去请一个人？", emoji: "🏡", chapterIdx: 1,
    summary: "刘备三次拜访，终于请出卧龙诸葛亮，得到「三分天下」的大计。" },
  { key: "changbanpo", name: "长坂坡之战", kidTitle: "赵云怎样在万军中救出小主人？", emoji: "🐎", img: eImg("changbanpo"),
    summary: "赵云在长坂坡单枪匹马、几进几出，救出了刘备的儿子阿斗。" },
  { key: "caochuan", name: "草船借箭", kidTitle: "不造箭，怎么得到十万支箭？", emoji: "🏹", img: eImg("caochuanjiejian"), chapterIdx: 2,
    summary: "诸葛亮利用江上大雾，用草船向曹操「借」来了十万支箭。" },
  { key: "chibi", name: "赤壁之战", kidTitle: "弱小联盟怎样打败强大敌人？", emoji: "🔥", chapterIdx: 3,
    summary: "孙权刘备联手，用火攻在赤壁大败曹操，三国鼎立的局面逐渐形成。" },
  { key: "qiqin", name: "七擒孟获", kidTitle: "怎样让对手心服口服？", emoji: "🌴", chapterIdx: 5,
    summary: "诸葛亮七次抓住孟获、又七次放他，最终让他真心归顺。" },
  { key: "kongcheng", name: "空城计", kidTitle: "没有兵，怎么吓退敌人？", emoji: "🏯", chapterIdx: 4,
    summary: "诸葛亮大开城门、镇定弹琴，吓得多疑的司马懿不敢进城。" },
];

const BADGES: Badge[] = [
  { key: "first-step", title: "初入三国", icon: "⭐", desc: "读完第一个三国故事", condition: { type: "chaptersAtLeast", n: 1 } },
  { key: "taoyuan", title: "桃园结义", icon: "🌸", desc: "读完《桃园三结义》", condition: { type: "chapterDone", idx: 0 } },
  { key: "meet-heroes", title: "群英相识", icon: "🤝", desc: "认识 3 位三国人物", condition: { type: "peopleKnownAtLeast", n: 3 } },
  { key: "chibi", title: "火烧赤壁", icon: "🔥", desc: "读完《赤壁之战》", condition: { type: "chapterDone", idx: 3 } },
  { key: "little-strategist", title: "三国小军师", icon: "🏯", desc: "读完全部 6 个三国故事", condition: { type: "chaptersAtLeast", n: 6 } },
];

export const THREE_KINGDOMS_DETAIL: DynastyDetail = {
  id: "three-kingdoms",
  name: "三国",
  time: "220—280",
  slogan: "英雄辈出，三足鼎立",
  introForKids: "三国是魏、蜀、吴三个国家互相竞争的时代，这里英雄很多、谋略很多、故事也很多。",
  keywords: ["英雄", "谋略", "三足鼎立"],
  openingQuestions: [
    { q: "为什么天下会分成魏、蜀、吴三个国家？", chapterIdx: 3 }, // 赤壁之战 → 三足鼎立形成
    { q: "诸葛亮不造一支箭，怎么得到十万支箭？", chapterIdx: 2 }, // 草船借箭
    { q: "刘备为什么三次去请同一个人？", chapterIdx: 1 }, // 三顾茅庐
  ],
  factions: FACTIONS,
  people: PEOPLE,
  events: EVENTS,
  badges: BADGES,
};
