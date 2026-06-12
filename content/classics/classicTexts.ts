// content/classics/classicTexts.ts
// 庄子寓言的「经典版」精选名段（逐句精读）。键 = 对应寓言的 StoryBook.id（见 parables.ts）。
// 原文取自公有领域《庄子》（ctext.org），只选最经典、原文短而可朗读的一小段；不放整篇文言文。
// 白话直译贴着原句、不发挥；关键字/词/典故就近放在该句 notes。
import type { ClassicText } from "./types";

export const CLASSIC_TEXTS: Record<string, ClassicText> = {
  // 《庄子·秋水》「埳井之蛙」：浅井青蛙向东海大鳖夸耀小井，听大鳖讲大海后才知自己见识太小。
  "zhuangzi-jingdizhiwa": {
    source: "《庄子·秋水》",
    intro:
      "一只住在浅井里的青蛙，向东海来的大鳖夸耀自己的小井——后人就用「井底之蛙」比喻见识少、却以为自己什么都懂。",
    lines: [
      {
        original: "吾乐与！",
        pinyin: "wú lè yú",
        translation: "我快乐极了！",
        notes: [
          { term: "吾", kind: "字", explain: "我，自己。" },
          { term: "与", kind: "字", explain: "这里读 yú，是句末表示感叹的语气词，相当于「啊」。" },
        ],
      },
      {
        original: "擅一壑之水，而跨跱埳井之乐，此亦至矣。",
        pinyin: "shàn yī hè zhī shuǐ, ér kuà zhì kǎn jǐng zhī lè, cǐ yì zhì yǐ",
        translation: "独占这一小坑水、盘踞着这口浅井的快乐，也算到顶了。",
        notes: [
          { term: "擅", kind: "字", explain: "独占、独自拥有。" },
          { term: "壑", kind: "字", explain: "读 hè，山沟、水坑。" },
          { term: "跨跱", kind: "词", explain: "读 kuà zhì，叉开腿盘踞、占着不走的样子。" },
        ],
      },
      {
        original: "东海之鳖告之曰：",
        pinyin: "dōng hǎi zhī biē gào zhī yuē",
        translation: "东海里来的大鳖告诉它说：",
        notes: [
          { term: "鳖", kind: "字", explain: "读 biē，一种像乌龟的水生动物，这里指见多识广的大海龟。" },
        ],
      },
      {
        original: "千里之远，不足以举其大；千仞之高，不足以极其深。",
        pinyin: "qiān lǐ zhī yuǎn, bù zú yǐ jǔ qí dà; qiān rèn zhī gāo, bù zú yǐ jí qí shēn",
        translation: "用一千里那么远，也说不尽大海有多宽广；用一千仞那么高，也量不到大海有多深。",
        notes: [
          { term: "举", kind: "字", explain: "这里是「说尽、形容完」的意思。" },
          { term: "仞", kind: "字", explain: "读 rèn，古代量高度的单位，一仞大约是一个大人张开双臂的高度。" },
          { term: "极", kind: "字", explain: "这里是「量到底、到尽头」的意思。" },
        ],
      },
      {
        original: "埳井之蛙闻之，适适然惊，规规然自失也。",
        pinyin: "kǎn jǐng zhī wā wén zhī, shì shì rán jīng, guī guī rán zì shī yě",
        translation: "浅井里的青蛙听了这番话，惊讶得发愣，呆呆地觉得自己一下子什么都不懂了。",
        notes: [
          { term: "埳井", kind: "词", explain: "读 kǎn jǐng，又浅又小的井。埳同「坎」，低洼塌陷。" },
          { term: "适适然", kind: "词", explain: "吃惊发愣的样子。" },
          { term: "规规然", kind: "词", explain: "拘谨呆滞、半天回不过神的样子。" },
        ],
      },
    ],
  },

  // 《庄子·齐物论》篇末「庄周梦蝶」：分不清是庄周梦成蝴蝶，还是蝴蝶梦成庄周——这就叫「物化」。
  "zhuangzi-mengdie": {
    source: "《庄子·齐物论》",
    intro:
      "庄周梦见自己变成蝴蝶，醒来却分不清：到底是庄周梦成了蝴蝶，还是蝴蝶梦成了庄周？这就是有名的「庄周梦蝶」。",
    lines: [
      {
        original: "昔者庄周梦为胡蝶，栩栩然胡蝶也，",
        pinyin: "xī zhě zhuāng zhōu mèng wéi hú dié, xǔ xǔ rán hú dié yě",
        translation: "从前，庄周梦见自己变成了一只蝴蝶，活灵活现，真就是一只蝴蝶呀，",
        notes: [
          { term: "昔者", kind: "词", explain: "从前、过去。" },
          { term: "栩栩然", kind: "典故", explain: "读 xǔ xǔ rán，活泼生动、像活的一样；成语「栩栩如生」就从这里来。" },
          { term: "胡蝶", kind: "字", explain: "就是「蝴蝶」，古文里写作「胡蝶」。" },
        ],
      },
      {
        original: "自喻适志与！不知周也。",
        pinyin: "zì yù shì zhì yú! bù zhī zhōu yě",
        translation: "自己觉得舒心快意极了，完全忘了自己原本是庄周。",
        notes: [
          { term: "自喻", kind: "词", explain: "自己感到、自己觉得。" },
          { term: "适志", kind: "词", explain: "心意舒畅、称心如意。" },
        ],
      },
      {
        original: "俄然觉，则蘧蘧然周也。",
        pinyin: "é rán jué, zé qú qú rán zhōu yě",
        translation: "忽然醒了过来，惊觉自己分明还是庄周。",
        notes: [
          { term: "俄然", kind: "词", explain: "一会儿、忽然。" },
          { term: "觉", kind: "字", explain: "这里读 jué，是「睡醒」。" },
          { term: "蘧蘧然", kind: "典故", explain: "读 qú qú rán，一下子惊醒、清清楚楚的样子。" },
        ],
      },
      {
        original: "不知周之梦为胡蝶与，胡蝶之梦为周与？",
        pinyin: "bù zhī zhōu zhī mèng wéi hú dié yú, hú dié zhī mèng wéi zhōu yú",
        translation: "不知道是庄周做梦变成了蝴蝶，还是蝴蝶做梦变成了庄周？",
        notes: [
          { term: "与", kind: "字", explain: "读 yú，句末表示疑问的语气词，相当于「呢」。" },
        ],
      },
      {
        original: "周与胡蝶，则必有分矣。此之谓物化。",
        pinyin: "zhōu yǔ hú dié, zé bì yǒu fèn yǐ. cǐ zhī wèi wù huà",
        translation: "庄周和蝴蝶，总该是有分别的吧。这种万物彼此转化的奇妙，就叫作「物化」。",
        notes: [
          { term: "分", kind: "字", explain: "这里读 fèn，是「分别、界限」。" },
          { term: "物化", kind: "典故", explain: "庄子的著名说法——万物可以互相转化、彼此交融，分不出绝对的界限。" },
        ],
      },
    ],
  },
};
