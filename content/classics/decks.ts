// content/classics/decks.ts
// 诸子名句卡组：老子 / 孔子 / 孟子。原句 + 拼音 + 童趣白话 + 解读 + 生活小例子。
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
      },
    ],
  },
];
