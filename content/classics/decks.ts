// content/classics/decks.ts
// 诸子名句卡组：老子 / 孔子 / 孟子。原句 + 拼音 + 童趣白话 + 解读 + 生活小例子 + 关键字词/典故 + 一道理解题。
// v1 用 emoji 占位，image 留空待补静态图。
import type { QuoteDeck } from "./types";

export const QUOTE_DECKS: QuoteDeck[] = [
  {
    id: "laozi-daodejing",
    philosopher: "老子",
    source: "《道德经》",
    title: "老子的智慧",
    emoji: "🌊",
    cards: [
      {
        id: "shangshanruoshui",
        text: "上善若水",
        pinyin: "shàng shàn ruò shuǐ",
        meaning: "最好的品格，就像水一样。",
        interpretation:
          "水从不和谁争抢，却能滋养花草树木；遇到石头就绕过去，遇到低处就流下去，又柔软又有力量。最善良的人也像水，温柔、不爱争，却悄悄帮助了身边好多人。",
        example: "排队的时候让一让别人、不抢先，就是像水一样的温柔。",
        emoji: "💧",
        glossary: [
          { term: "善", kind: "字", explain: "美好、品德高尚。" },
          { term: "若", kind: "字", explain: "像、好像。" },
        ],
        question: {
          q: "「上善若水」说最好的品格像水，主要是夸水的什么特点？",
          choices: [
            "又凶又急，谁都怕它",
            "温柔不爱争，却默默帮助大家",
            "只往高处流",
            "最爱和别人比谁厉害",
          ],
          answer: 1,
          explain: "水不争抢，却滋养万物——最善良的人也这样，温柔、不争，悄悄帮助身边的人。",
        },
      },
      {
        id: "qianlizhixing",
        text: "千里之行，始于足下",
        pinyin: "qiān lǐ zhī xíng, shǐ yú zú xià",
        meaning: "走一千里的远路，也是从脚下第一步开始的。",
        interpretation:
          "再了不起的大事，都不是一下子做完的，而是从最小的一步开始，一步一步走出来的。别怕路远，肯迈出第一步最重要。",
        example: "想学会跳绳，就从今天先跳一个开始，明天再多跳几个。",
        emoji: "👣",
        glossary: [
          { term: "始", kind: "字", explain: "开始。" },
          { term: "足下", kind: "词", explain: "脚下，指眼前能迈出的第一步。" },
        ],
        question: {
          q: "「千里之行，始于足下」告诉我们做大事要怎么开始？",
          choices: [
            "等准备得完完美美再开始",
            "从脚下的第一步开始，一步步走",
            "一下子全做完才算厉害",
            "让别人替自己走",
          ],
          answer: 1,
          explain: "再远的路也是从第一步开始的；肯迈出第一步、一步步走，最重要。",
        },
      },
      {
        id: "zhirenzhezhi",
        text: "知人者智，自知者明",
        pinyin: "zhī rén zhě zhì, zì zhī zhě míng",
        meaning: "看得懂别人，是聪明；看得清自己，才是真正的明白。",
        interpretation:
          "能看出别人的长处和心思，已经很聪明了；但更厉害的，是知道自己擅长什么、还有哪些地方要努力。了解了自己，才能不断变得更好。",
        example: "知道自己算术快、画画还要练，就是「自知」，然后多去练画画。",
        emoji: "🪞",
        glossary: [
          { term: "智", kind: "字", explain: "聪明、有智慧。" },
          { term: "明", kind: "字", explain: "心里明白、看得清自己。" },
        ],
        question: {
          q: "按老子的话，什么才算「真正的明白」？",
          choices: [
            "能看懂别人的心思",
            "看得清自己、知道自己要努力的地方",
            "认识很多很多人",
            "考试考第一名",
          ],
          answer: 1,
          explain: "看懂别人是聪明，看清自己才是「明」——了解自己，才能不断变得更好。",
        },
      },
      {
        id: "tianxianashi",
        text: "天下难事，必作于易",
        pinyin: "tiān xià nán shì, bì zuò yú yì",
        meaning: "天底下再难的事，都得从容易的地方先做起。",
        interpretation:
          "看起来很难的事，别一开始就被吓住。把它拆成一个个简单的小步骤，先做最容易的那一步，难事就慢慢变简单了。",
        example: "觉得一篇课文好难背，就先背会第一句，再一句一句加上去。",
        emoji: "🧩",
        glossary: [
          { term: "作", kind: "字", explain: "着手去做、开始做。" },
          { term: "于易", kind: "词", explain: "从容易的地方入手。" },
        ],
        question: {
          q: "遇到看起来很难的事，老子建议怎么做？",
          choices: [
            "马上放弃不做了",
            "先做最容易的那一步，把难事拆开",
            "专挑最难的先做",
            "假装看不见它",
          ],
          answer: 1,
          explain: "再难的事都从容易处做起；拆成小步骤、先做最容易的，难事就慢慢变简单。",
        },
      },
      {
        id: "hebaozhimu",
        text: "合抱之木，生于毫末",
        pinyin: "hé bào zhī mù, shēng yú háo mò",
        meaning: "要张开两只手才抱得住的大树，也是从一颗小小的嫩芽长出来的。",
        interpretation:
          "再高大的东西，都有一个很小很小的开始。只要肯一点一点积累、慢慢长大，小小的努力也会变成了不起的大本领。",
        example: "今天认识一个字，明天再认识一个，慢慢就能读一整本书啦。",
        emoji: "🌳",
        glossary: [
          { term: "合抱", kind: "词", explain: "两臂张开才抱得住，形容树又粗又大。" },
          { term: "毫末", kind: "词", explain: "细毛的尖儿，比喻极小的开始。" },
        ],
        question: {
          q: "「合抱之木，生于毫末」想告诉我们什么？",
          choices: [
            "大树天生就很大",
            "再大的东西也从很小的开始，慢慢长大",
            "小嫩芽永远长不大",
            "树越粗就越没用",
          ],
          answer: 1,
          explain: "粗大的树也是从小嫩芽长出来的；一点点积累，小努力会变成大本领。",
        },
      },
      {
        id: "zhizuzhefu",
        text: "知足者富",
        pinyin: "zhī zú zhě fù",
        meaning: "懂得满足的人，才是真正富有的人。",
        interpretation:
          "富有不只是东西多。有的人东西很多，却总觉得不够、不开心；懂得珍惜自己已经拥有的，心里满满的，那才是真正的富足和快乐。",
        example: "玩具不用很多，珍惜手里这一个、玩得开开心心，就很富有啦。",
        emoji: "😊",
        glossary: [
          { term: "足", kind: "字", explain: "满足。" },
          { term: "富", kind: "字", explain: "富有；这里更指心里富足。" },
        ],
        question: {
          q: "老子说「知足者富」，真正富有的人是谁？",
          choices: [
            "东西最多的人",
            "懂得满足、珍惜自己拥有的人",
            "总觉得还不够的人",
            "什么都想要的人",
          ],
          answer: 1,
          explain: "富有不只是东西多；懂得珍惜已经拥有的、心里满足，才是真正的富足。",
        },
      },
    ],
  },
  {
    id: "kongzi-lunyu",
    philosopher: "孔子",
    source: "《论语》",
    title: "孔子的好习惯",
    emoji: "📚",
    cards: [
      {
        id: "xueershixizhi",
        text: "学而时习之，不亦说乎",
        pinyin: "xué ér shí xí zhī, bù yì yuè hū",
        meaning: "学到新本领，常常拿出来练一练，不是很开心吗？",
        interpretation:
          "学过的东西，要时不时复习、动手用一用，才会真正变成自己的。一边学一边练，越练越会，心里也会美滋滋的。",
        example: "学会了系鞋带，每天自己系一次，很快就系得又快又好。",
        emoji: "📖",
        glossary: [
          { term: "时", kind: "字", explain: "时常、按时。" },
          { term: "习", kind: "字", explain: "温习、练习。" },
          { term: "说", kind: "字", explain: "同「悦」，读 yuè，高兴。" },
        ],
        question: {
          q: "「学而时习之」里的「习」是什么意思？",
          choices: ["睡觉休息", "时常复习、练习", "玩游戏", "把书收起来"],
          answer: 1,
          explain: "「习」是温习、练习；学过的常拿出来练一练，才会真正学会，心里也开心。",
        },
      },
      {
        id: "sanrenxing",
        text: "三人行，必有我师焉",
        pinyin: "sān rén xíng, bì yǒu wǒ shī yān",
        meaning: "几个人走在一起，里面一定有能当我老师的人。",
        interpretation:
          "每个人都有值得学习的地方。看到别人做得好，就学过来；看到别人的小毛病，就提醒自己别犯。这样，身边人人都能当我们的小老师。",
        example: "同桌画画好看，就向他请教；他爱迟到，自己就提醒自己别迟到。",
        emoji: "🧑‍🏫",
        glossary: [
          { term: "行", kind: "字", explain: "走在一起、同行。" },
          { term: "焉", kind: "字", explain: "句末语气词，含「在其中」的意思。" },
        ],
        question: {
          q: "「三人行，必有我师焉」教我们怎么看待身边的人？",
          choices: [
            "只跟最厉害的人玩",
            "每个人都有值得我学习的地方",
            "别人都不如自己",
            "谁也不用理会",
          ],
          answer: 1,
          explain: "看到别人做得好就学过来，看到毛病就提醒自己；人人都能当我们的小老师。",
        },
      },
      {
        id: "wenguzhixin",
        text: "温故而知新",
        pinyin: "wēn gù ér zhī xīn",
        meaning: "把学过的旧知识复习一遍，常常能发现新的道理。",
        interpretation:
          "复习不是白费功夫。重新看一遍学过的东西，往往会想到上次没注意的地方，明白新的意思。旧知识里，藏着新发现。",
        example: "再读一遍以前的故事，可能会读懂上次没看明白的那句话。",
        emoji: "🔁",
        glossary: [
          { term: "温", kind: "字", explain: "温习、复习。" },
          { term: "故", kind: "字", explain: "旧的、学过的东西。" },
        ],
        question: {
          q: "「温故而知新」是说复习旧知识会怎么样？",
          choices: [
            "白白浪费时间",
            "常常能发现新的道理",
            "把旧的都忘光",
            "越复习越糊涂",
          ],
          answer: 1,
          explain: "重看学过的东西，往往会想到上次没注意的地方，明白新意思——旧知识里藏着新发现。",
        },
      },
      {
        id: "jisuobuyu",
        text: "己所不欲，勿施于人",
        pinyin: "jǐ suǒ bù yù, wù shī yú rén",
        meaning: "自己不喜欢的事，就别加到别人身上。",
        interpretation:
          "想知道该怎么对待别人，先问问自己：这件事如果发生在我身上，我愿意吗？自己不愿意被嘲笑、被抢东西，就别那样去对别人。",
        example: "自己不喜欢被插队，那排队时也不去插别人的队。",
        emoji: "🤝",
        glossary: [
          { term: "欲", kind: "字", explain: "想要、喜欢。" },
          { term: "勿", kind: "字", explain: "不要。" },
          { term: "施", kind: "字", explain: "加给、施加到。" },
        ],
        question: {
          q: "「己所不欲，勿施于人」教我们怎么对待别人？",
          choices: [
            "自己不喜欢的，也别加给别人",
            "自己想怎样就怎样",
            "自己不要的都丢给别人",
            "只对自己好就行",
          ],
          answer: 0,
          explain: "自己不愿意被嘲笑、被抢东西，就别那样对别人；先想想换作自己愿不愿意。",
        },
      },
    ],
  },
  {
    id: "mengzi-mengzi",
    philosopher: "孟子",
    source: "《孟子》",
    title: "孟子的大心胸",
    emoji: "🌱",
    cards: [
      {
        id: "laowulao",
        text: "老吾老，以及人之老",
        pinyin: "lǎo wú lǎo, yǐ jí rén zhī lǎo",
        meaning: "尊敬自己家的老人，也一样去尊敬别人家的老人。",
        interpretation:
          "孟子说，一份好心肠不要只留给自己家人。爱护自己的爷爷奶奶，也去关心别的老人；这样的善意传开了，世界就变得特别温暖。",
        example: "公交车上，给自己的奶奶让座，也给不认识的老爷爷让座。",
        emoji: "👵",
        glossary: [
          { term: "老吾老", kind: "典故", explain: "前一个「老」是「尊敬奉养」，后一个「老」指家里的老人。" },
          { term: "及", kind: "字", explain: "推及、推广到。" },
        ],
        question: {
          q: "「老吾老，以及人之老」是说爱护老人要怎样？",
          choices: [
            "只疼自己家的老人",
            "爱自己家的老人，也去关心别人家的老人",
            "老人的事谁也不用管",
            "觉得老人很麻烦",
          ],
          answer: 1,
          explain: "好心肠不要只留给自己家人；爱护自家长辈，也关心别的老人，世界就更温暖。",
        },
      },
      {
        id: "tianshidili",
        text: "天时不如地利，地利不如人和",
        pinyin: "tiān shí bù rú dì lì, dì lì bù rú rén hé",
        meaning: "好天气比不上好地方，好地方又比不上大家齐心。",
        interpretation:
          "做成一件事，运气和条件都有用，但最重要的是「人和」——大家团结一心、互相帮忙。人心齐了，再难的事也能一起做成。",
        example: "拔河比赛，光有力气还不够，全队一起喊「一二」使劲才会赢。",
        emoji: "🤝",
        glossary: [
          { term: "天时", kind: "词", explain: "有利的时机、天气。" },
          { term: "地利", kind: "词", explain: "有利的地势、位置。" },
          { term: "人和", kind: "词", explain: "人心齐、大家团结。" },
        ],
        question: {
          q: "孟子认为，做成一件事最重要的是什么？",
          choices: [
            "好天气（天时）",
            "好地方（地利）",
            "大家齐心、团结（人和）",
            "运气好",
          ],
          answer: 2,
          explain: "天时、地利都有用，但最重要的是「人和」——大家团结一心，再难的事也能做成。",
        },
      },
      {
        id: "shengyuyouhuan",
        text: "生于忧患，死于安乐",
        pinyin: "shēng yú yōu huàn, sǐ yú ān lè",
        meaning: "困难让人成长，太舒服反而容易松懈退步。",
        interpretation:
          "遇到困难、需要努力的时候，我们会变得更强、更能干；要是天天只顾着舒服、什么都不练，本领反而会慢慢退步。适当的挑战，是成长的好朋友。",
        example: "每天练一道难题，会越来越厉害；总挑最简单的做，就很难进步。",
        emoji: "💪",
        glossary: [
          { term: "忧患", kind: "词", explain: "困难和让人操心的事。" },
          { term: "安乐", kind: "词", explain: "安逸、只顾享乐。" },
        ],
        question: {
          q: "「生于忧患，死于安乐」提醒我们什么？",
          choices: [
            "越舒服越好",
            "适当的困难和挑战让人成长，太安逸会退步",
            "什么都别努力",
            "困难全是坏事",
          ],
          answer: 1,
          explain: "需要努力时我们会变强；只顾舒服、什么都不练，本领反而退步。挑战是成长的好朋友。",
        },
      },
    ],
  },
];
