import type { PinyinChartItem } from "./pinyin-chart";
import { toneMarkedSyllables, type PinyinTone } from "./pinyin-speech";

interface ToneExampleSeed {
  syllable: string;
  phoneme: string;
  character: string;
  word: string;
}

export interface PinyinToneExample extends ToneExampleSeed {
  tone: PinyinTone;
  label: string;
}

type ToneExampleSet = readonly [ToneExampleSeed | null, ToneExampleSeed | null, ToneExampleSeed | null, ToneExampleSeed | null];

const e = (syllable: string, phoneme: string, character: string, word: string): ToneExampleSeed => ({ syllable, phoneme, character, word });

const TONE_EXAMPLES: Readonly<Record<string, ToneExampleSet>> = {
  "simple-final-a": [e("mā", "ma1", "妈", "妈妈"), e("má", "ma2", "麻", "麻绳"), e("mǎ", "ma3", "马", "小马"), e("mà", "ma4", "骂", "责骂")],
  "simple-final-o": [e("bō", "bo1", "波", "波浪"), e("bó", "bo2", "伯", "伯伯"), e("wǒ", "wo3", "我", "我们"), e("wò", "wo4", "卧", "卧室")],
  "simple-final-e": [e("gē", "ge1", "哥", "哥哥"), e("é", "e2", "鹅", "白鹅"), e("kě", "ke3", "可", "可以"), e("è", "e4", "饿", "饥饿")],
  "simple-final-i": [e("yī", "yi1", "衣", "衣服"), e("yí", "yi2", "姨", "阿姨"), e("yǐ", "yi3", "椅", "椅子"), e("yì", "yi4", "意", "意思")],
  "simple-final-u": [e("wū", "wu1", "屋", "房屋"), e("wú", "wu2", "无", "无人"), e("wǔ", "wu3", "五", "五个"), e("wù", "wu4", "物", "物品")],
  "simple-final-ü": [null, e("yú", "yu2", "鱼", "小鱼"), e("yǔ", "yu3", "雨", "下雨"), e("yù", "yu4", "玉", "玉米")],

  "compound-final-ai": [e("pāi", "pai1", "拍", "拍手"), e("pái", "pai2", "排", "排队"), e("mǎi", "mai3", "买", "买东西"), e("mài", "mai4", "卖", "卖东西")],
  "compound-final-ei": [e("fēi", "fei1", "飞", "飞机"), e("féi", "fei2", "肥", "肥皂"), e("běi", "bei3", "北", "北方"), e("lèi", "lei4", "泪", "眼泪")],
  "compound-final-ui": [e("guī", "gui1", "龟", "乌龟"), e("huí", "hui2", "回", "回家"), e("shuǐ", "shui3", "水", "水杯"), e("duì", "dui4", "对", "对错")],
  "compound-final-ao": [e("māo", "mao1", "猫", "小猫"), e("táo", "tao2", "桃", "桃子"), e("hǎo", "hao3", "好", "好人"), e("dào", "dao4", "到", "到达")],
  "compound-final-ou": [e("dōu", "dou1", "都", "都是"), e("lóu", "lou2", "楼", "高楼"), e("gǒu", "gou3", "狗", "小狗"), e("dòu", "dou4", "豆", "豆子")],
  "compound-final-iu": [e("qiū", "qiu1", "秋", "秋天"), e("liú", "liu2", "流", "河流"), e("jiǔ", "jiu3", "九", "九个"), e("liù", "liu4", "六", "六个")],
  "compound-final-ie": [e("tiē", "tie1", "贴", "贴纸"), e("dié", "die2", "蝶", "蝴蝶"), e("xiě", "xie3", "写", "写字"), e("yè", "ye4", "叶", "树叶")],
  "compound-final-üe": [e("yuē", "yue1", "约", "大约"), e("xué", "xue2", "学", "学习"), e("xuě", "xue3", "雪", "下雪"), e("yuè", "yue4", "月", "月亮")],
  "compound-final-er": [null, e("ér", "er2", "儿", "儿童"), e("ěr", "er3", "耳", "耳朵"), e("èr", "er4", "二", "第二")],

  "nasal-final-an": [e("bān", "ban1", "班", "班级"), e("lán", "lan2", "蓝", "蓝色"), e("wǎn", "wan3", "碗", "饭碗"), e("dàn", "dan4", "蛋", "鸡蛋")],
  "nasal-final-en": [e("fēn", "fen1", "分", "分开"), e("mén", "men2", "门", "大门"), e("fěn", "fen3", "粉", "面粉"), e("bèn", "ben4", "笨", "笨重")],
  "nasal-final-in": [e("jīn", "jin1", "今", "今天"), e("lín", "lin2", "林", "树林"), e("pǐn", "pin3", "品", "品尝"), e("jìn", "jin4", "进", "进门")],
  "nasal-final-un": [e("chūn", "chun1", "春", "春天"), e("lún", "lun2", "轮", "车轮"), e("gǔn", "gun3", "滚", "滚动"), e("kùn", "kun4", "困", "困难")],
  "nasal-final-ün": [e("jūn", "jun1", "军", "军人"), e("qún", "qun2", "群", "人群"), e("yǔn", "yun3", "允", "允许"), e("jùn", "jun4", "俊", "俊俏")],
  "nasal-final-ang": [e("fāng", "fang1", "方", "方向"), e("táng", "tang2", "糖", "糖果"), e("xiǎng", "xiang3", "想", "想法"), e("bàng", "bang4", "棒", "木棒")],
  "nasal-final-eng": [e("fēng", "feng1", "风", "大风"), e("néng", "neng2", "能", "能够"), e("děng", "deng3", "等", "等待"), e("pèng", "peng4", "碰", "碰面")],
  "nasal-final-ing": [e("xīng", "xing1", "星", "星星"), e("píng", "ping2", "平", "平安"), e("qǐng", "qing3", "请", "请问"), e("dìng", "ding4", "定", "一定")],
  "nasal-final-ong": [e("dōng", "dong1", "东", "东方"), e("hóng", "hong2", "红", "红色"), e("kǒng", "kong3", "孔", "孔雀"), e("dòng", "dong4", "动", "动物")],

  "whole-syllable-zhi": [e("zhī", "zhi1", "知", "知道"), e("zhí", "zhi2", "直", "直线"), e("zhǐ", "zhi3", "纸", "白纸"), e("zhì", "zhi4", "至", "至少")],
  "whole-syllable-chi": [e("chī", "chi1", "吃", "吃饭"), e("chí", "chi2", "池", "池塘"), e("chǐ", "chi3", "尺", "尺子"), e("chì", "chi4", "翅", "翅膀")],
  "whole-syllable-shi": [e("shī", "shi1", "师", "老师"), e("shí", "shi2", "十", "十个"), e("shǐ", "shi3", "使", "使用"), e("shì", "shi4", "是", "是非")],
  "whole-syllable-ri": [null, null, null, e("rì", "ri4", "日", "日子")],
  "whole-syllable-zi": [e("zī", "zi1", "资", "资料"), null, e("zǐ", "zi3", "子", "孩子"), e("zì", "zi4", "字", "汉字")],
  "whole-syllable-ci": [e("cī", "ci1", "疵", "瑕疵"), e("cí", "ci2", "词", "词语"), e("cǐ", "ci3", "此", "因此"), e("cì", "ci4", "次", "次数")],
  "whole-syllable-si": [e("sī", "si1", "思", "思考"), null, e("sǐ", "si3", "死", "生死"), e("sì", "si4", "四", "四个")],
  "whole-syllable-yi": [e("yī", "yi1", "衣", "衣服"), e("yí", "yi2", "姨", "阿姨"), e("yǐ", "yi3", "椅", "椅子"), e("yì", "yi4", "意", "意思")],
  "whole-syllable-wu": [e("wū", "wu1", "屋", "房屋"), e("wú", "wu2", "无", "无人"), e("wǔ", "wu3", "五", "五个"), e("wù", "wu4", "物", "物品")],
  "whole-syllable-yu": [null, e("yú", "yu2", "鱼", "小鱼"), e("yǔ", "yu3", "雨", "下雨"), e("yù", "yu4", "玉", "玉米")],
  "whole-syllable-ye": [e("yē", "ye1", "耶", "好耶"), e("yé", "ye2", "爷", "爷爷"), e("yě", "ye3", "也", "也好"), e("yè", "ye4", "叶", "树叶")],
  "whole-syllable-yue": [e("yuē", "yue1", "约", "大约"), null, null, e("yuè", "yue4", "月", "月亮")],
  "whole-syllable-yuan": [null, e("yuán", "yuan2", "元", "元旦"), e("yuǎn", "yuan3", "远", "远方"), e("yuàn", "yuan4", "院", "院子")],
  "whole-syllable-yin": [e("yīn", "yin1", "音", "音乐"), e("yín", "yin2", "银", "银行"), e("yǐn", "yin3", "引", "引导"), e("yìn", "yin4", "印", "印章")],
  "whole-syllable-yun": [e("yūn", "yun1", "晕", "晕倒"), e("yún", "yun2", "云", "云朵"), e("yǔn", "yun3", "允", "允许"), e("yùn", "yun4", "运", "运动")],
  "whole-syllable-ying": [e("yīng", "ying1", "英", "英语"), e("yíng", "ying2", "营", "营地"), e("yǐng", "ying3", "影", "影子"), e("yìng", "ying4", "硬", "坚硬")],
};

export function pinyinToneExamples(item: PinyinChartItem): readonly PinyinToneExample[] {
  if (item.category === "initial") return [];
  const labels = toneMarkedSyllables(item.display);
  return (TONE_EXAMPLES[item.id] ?? []).flatMap((seed, index) => seed ? [{ ...seed, tone: (index + 1) as PinyinTone, label: labels[index] }] : []);
}
