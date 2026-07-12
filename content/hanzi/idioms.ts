export type IdiomAgeBand = "6-8" | "9-10";

export type IdiomQuiz =
  | { type: "meaning-choice"; prompt: string; choices: readonly string[]; answer: string }
  | { type: "usage-choice"; prompt: string; choices: readonly string[]; answer: string }
  | { type: "key-char"; prompt: string; answer: string };

export interface IdiomLesson {
  id: string;
  idiom: string;
  pinyin: string;
  meaning: string;
  origin: string;
  story: string;
  example: string;
  keyChars: readonly string[];
  ageBand: IdiomAgeBand;
  quiz: readonly IdiomQuiz[];
}

const CORE_IDIOMS: readonly IdiomLesson[] = [
  {
    id: "hua-long-dian-jing",
    idiom: "画龙点睛",
    pinyin: "huà lóng diǎn jīng",
    meaning: "最后加上关键一笔，让作品更精彩。",
    origin: "唐代《历代名画记》",
    story: "传说画师张僧繇在墙上画龙，却一直不点眼睛。大家很好奇，他说点上眼睛龙就会飞走。后来他一点眼睛，龙像活了一样腾空而去。",
    example: "你的作文结尾写得很好，真是画龙点睛。",
    keyChars: ["画", "龙", "点", "睛"],
    ageBand: "6-8",
    quiz: [
      {
        type: "meaning-choice",
        prompt: "画龙点睛是什么意思？",
        choices: ["关键处加一笔", "把龙画得很慢", "只画眼睛"],
        answer: "关键处加一笔",
      },
      { type: "key-char", prompt: "成语里哪个字表示加上一点？", answer: "点" },
      { type: "usage-choice", prompt: "哪件事最像画龙点睛？", choices: ["给画加上精彩标题", "把画揉成一团", "只准备画纸"], answer: "给画加上精彩标题" },
    ],
  },
  {
    id: "yi-ye-zhi-qiu",
    idiom: "一叶知秋",
    pinyin: "yī yè zhī qiū",
    meaning: "从一个小变化，知道大变化快来了。",
    origin: "《淮南子》相关典故",
    story: "秋天快到时，树上的一片叶子先变黄、落下。细心的人看到这片叶子，就知道天气要变凉，秋天正在靠近。",
    example: "看到第一片黄叶落下，奶奶说这是一叶知秋。",
    keyChars: ["一", "叶", "知", "秋"],
    ageBand: "6-8",
    quiz: [
      {
        type: "meaning-choice",
        prompt: "一叶知秋说明什么？",
        choices: ["从小变化看大变化", "一片叶子很重", "秋天只有一片叶"],
        answer: "从小变化看大变化",
      },
      { type: "key-char", prompt: "成语里你学过的数字字是哪一个？", answer: "一" },
      { type: "usage-choice", prompt: "哪句话可以用一叶知秋？", choices: ["看到燕子低飞，知道快下雨", "吃完一个苹果", "把叶子画成绿色"], answer: "看到燕子低飞，知道快下雨" },
    ],
  },
  {
    id: "san-xin-er-yi",
    idiom: "三心二意",
    pinyin: "sān xīn èr yì",
    meaning: "心里想法不专一，做事不专心。",
    origin: "古代俗语积累",
    story: "一个孩子一会儿想写字，一会儿想玩球，一会儿又想画画，结果哪件事都没有做好。大家说他做事三心二意。",
    example: "练字时不要三心二意，先把一个字写好。",
    keyChars: ["三", "心", "二", "意"],
    ageBand: "6-8",
    quiz: [
      {
        type: "usage-choice",
        prompt: "哪句话用对了三心二意？",
        choices: ["他专心读完一本书", "他写字时总想去玩", "他每天认真练琴"],
        answer: "他写字时总想去玩",
      },
      { type: "key-char", prompt: "成语里有哪些数字？", answer: "三二" },
      { type: "meaning-choice", prompt: "怎样做不是三心二意？", choices: ["专心完成一件事", "一会儿写字一会儿玩", "总是换目标"], answer: "专心完成一件事" },
    ],
  },
  {
    id: "shan-qing-shui-xiu",
    idiom: "山清水秀",
    pinyin: "shān qīng shuǐ xiù",
    meaning: "山水风景清新美丽。",
    origin: "古代山水诗文常用语",
    story: "人们看到青山、清水和好看的风景，就用山清水秀来赞美这个地方。这个成语常用来写自然景色。",
    example: "外婆家在山清水秀的小村子里。",
    keyChars: ["山", "水"],
    ageBand: "6-8",
    quiz: [
      {
        type: "meaning-choice",
        prompt: "山清水秀形容什么？",
        choices: ["风景美", "声音大", "天气冷"],
        answer: "风景美",
      },
      { type: "key-char", prompt: "成语里哪个字表示河水？", answer: "水" },
      { type: "usage-choice", prompt: "哪里可以用山清水秀？", choices: ["风景优美的小山村", "拥挤的停车场", "黑暗的仓库"], answer: "风景优美的小山村" },
    ],
  },
  {
    id: "wen-gu-zhi-xin",
    idiom: "温故知新",
    pinyin: "wēn gù zhī xīn",
    meaning: "复习旧知识，可以得到新的理解。",
    origin: "《论语》",
    story: "孔子告诉学生，常常复习学过的内容，会有新的发现。学习汉字也是这样，旧字复习几次，就会越来越熟。",
    example: "每天复习几个旧字，就是温故知新。",
    keyChars: ["故", "知", "新"],
    ageBand: "9-10",
    quiz: [
      {
        type: "meaning-choice",
        prompt: "温故知新和什么最接近？",
        choices: ["复习后有新理解", "只学新内容", "忘掉旧知识"],
        answer: "复习后有新理解",
      },
      {
        type: "usage-choice",
        prompt: "哪句话用对了温故知新？",
        choices: ["他复习旧课后想明白了新问题", "他把书藏起来", "他从不复习"],
        answer: "他复习旧课后想明白了新问题",
      },
      { type: "key-char", prompt: "温故知新里哪个字表示新的知识？", answer: "新" },
    ],
  },
  {
    id: "shou-zhu-dai-tu", idiom: "守株待兔", pinyin: "shǒu zhū dài tù", meaning: "只等偶然的好运，不主动努力。", origin: "《韩非子》", story: "农夫偶然捡到一只撞在树桩上的兔子，从此天天守着树桩，不再认真种田。可是兔子没有再来，田地也荒了。", example: "学习要天天练习，不能守株待兔。", keyChars: ["守", "兔"], ageBand: "6-8",
    quiz: [
      { type: "meaning-choice", prompt: "守株待兔提醒我们什么？", choices: ["不能只等好运", "每天要看兔子", "树桩很危险"], answer: "不能只等好运" },
      { type: "usage-choice", prompt: "谁在守株待兔？", choices: ["不练习却等满分的人", "每天认真读书的人", "主动帮助同学的人"], answer: "不练习却等满分的人" },
      { type: "key-char", prompt: "故事里农夫等待什么动物？", answer: "兔" },
    ],
  },
  {
    id: "wang-yang-bu-lao", idiom: "亡羊补牢", pinyin: "wáng yáng bǔ láo", meaning: "出了问题及时补救，还不算晚。", origin: "《战国策》", story: "羊圈破了洞，羊被狼叼走。邻居劝主人修好羊圈，他马上补牢，后来再也没有丢羊。大家都夸他改得及时。", example: "发现错题马上订正，正是亡羊补牢。", keyChars: ["羊", "补"], ageBand: "6-8",
    quiz: [
      { type: "meaning-choice", prompt: "亡羊补牢是什么意思？", choices: ["及时改正问题", "把羊送走", "不管错误"], answer: "及时改正问题" },
      { type: "usage-choice", prompt: "哪件事是亡羊补牢？", choices: ["摔倒后系好鞋带", "看见问题也不改", "把作业藏起来"], answer: "摔倒后系好鞋带" },
      { type: "key-char", prompt: "要修补的地方叫什么？", answer: "牢" },
    ],
  },
  {
    id: "jing-di-zhi-wa", idiom: "井底之蛙", pinyin: "jǐng dǐ zhī wā", meaning: "见识很少，却以为自己知道全部。", origin: "《庄子》相关故事", story: "青蛙一直住在井底，只能看见井口那么大的天空。海龟告诉它外面的世界很大，青蛙才知道自己的见识太少。", example: "多读书、多旅行，才不会成为井底之蛙。", keyChars: ["井", "蛙"], ageBand: "6-8",
    quiz: [
      { type: "meaning-choice", prompt: "井底之蛙形容什么人？", choices: ["见识少的人", "游泳快的人", "喜欢水的人"], answer: "见识少的人" },
      { type: "usage-choice", prompt: "怎样避免成为井底之蛙？", choices: ["多学习新知识", "从不听别人说", "只看一个地方"], answer: "多学习新知识" },
      { type: "key-char", prompt: "故事里的动物是什么？", answer: "蛙" },
    ],
  },
  {
    id: "ke-zhou-qiu-jian", idiom: "刻舟求剑", pinyin: "kè zhōu qiú jiàn", meaning: "方法不跟着情况变化，就解决不了问题。", origin: "《吕氏春秋》", story: "有人坐船时宝剑掉进水里，他只在船边刻下记号。船已经向前走了，他却到记号下面找剑，当然找不到。", example: "解决新问题要想新办法，不能刻舟求剑。", keyChars: ["舟", "剑"], ageBand: "9-10",
    quiz: [
      { type: "meaning-choice", prompt: "刻舟求剑错在哪里？", choices: ["没有根据变化调整方法", "剑太重", "船太小"], answer: "没有根据变化调整方法" },
      { type: "usage-choice", prompt: "谁在刻舟求剑？", choices: ["环境变了仍用旧位置寻找", "先观察再想办法", "根据地图改变路线"], answer: "环境变了仍用旧位置寻找" },
      { type: "key-char", prompt: "掉进水里的是什么？", answer: "剑" },
    ],
  },
  {
    id: "wen-ji-qi-wu", idiom: "闻鸡起舞", pinyin: "wén jī qǐ wǔ", meaning: "听到鸡叫就起床练功，形容勤奋努力。", origin: "《晋书》", story: "祖逖和刘琨年轻时立志报效国家。每天清晨听到鸡叫，他们就起床练剑，坚持不懈，后来都成为有本领的人。", example: "她每天早起练琴，真有闻鸡起舞的精神。", keyChars: ["鸡", "舞"], ageBand: "9-10",
    quiz: [
      { type: "meaning-choice", prompt: "闻鸡起舞赞美什么？", choices: ["勤奋坚持", "喜欢小鸡", "跳舞好看"], answer: "勤奋坚持" },
      { type: "usage-choice", prompt: "谁有闻鸡起舞的精神？", choices: ["每天坚持晨读的人", "总是睡懒觉的人", "遇到困难就放弃的人"], answer: "每天坚持晨读的人" },
      { type: "key-char", prompt: "听到什么动物叫就起床？", answer: "鸡" },
    ],
  },
] as const;

interface IdiomSeed { idiom: string; meaning: string; scene: string; ageBand?: IdiomAgeBand }

const ADDITIONAL_IDIOMS: readonly IdiomSeed[] = [
  { idiom: "拔苗助长", meaning: "做事太着急，反而会把事情弄坏。", scene: "禾苗需要慢慢长，不能用手硬往上拔" },
  { idiom: "狐假虎威", meaning: "借着别人的力量吓唬人。", scene: "狐狸走在老虎前面，让动物们误以为它很厉害" },
  { idiom: "掩耳盗铃", meaning: "自己欺骗自己，以为别人不知道。", scene: "偷铃的人捂住自己的耳朵，以为大家也听不到铃声" },
  { idiom: "自相矛盾", meaning: "前后说法互相冲突。", scene: "卖兵器的人说自己的矛和盾都是天下第一，却无法回答矛刺盾会怎样" },
  { idiom: "滥竽充数", meaning: "没有真本领，却混在有本领的人中间。", scene: "不会吹竽的人混进乐队，轮到独奏时只好逃走" },
  { idiom: "愚公移山", meaning: "只要坚持努力，再大的困难也能克服。", scene: "愚公带着家人每天挖山，从来没有因为困难而停止" },
  { idiom: "精卫填海", meaning: "意志坚定，坚持完成目标。", scene: "精卫鸟每天衔来石子和树枝，想把大海填平" },
  { idiom: "夸父逐日", meaning: "为了远大目标勇敢努力。", scene: "夸父不停追赶太阳，希望为大家留下光明" },
  { idiom: "叶公好龙", meaning: "嘴上说喜欢，实际上并不真正喜欢。", scene: "叶公家里到处画龙，真龙来了他却吓得逃跑" },
  { idiom: "杯弓蛇影", meaning: "因为疑心，把不存在的危险当成真的。", scene: "杯中的弓影看起来像蛇，让人白白担心了一场" },
  { idiom: "惊弓之鸟", meaning: "受过惊吓后，遇到一点动静就害怕。", scene: "受伤的鸟听到弓弦响声，就紧张得从空中掉下来" },
  { idiom: "画蛇添足", meaning: "做了多余的事，反而把事情弄坏。", scene: "蛇已经画好，又添上脚，结果失去了原本的奖品" },
  { idiom: "买椟还珠", meaning: "只注意外表，忽略真正有价值的东西。", scene: "买家留下漂亮盒子，却把盒子里的珍珠退了回去" },
  { idiom: "南辕北辙", meaning: "行动方向和目标完全相反。", scene: "想到南方去的人却驾车向北，走得越远离目标越远" },
  { idiom: "郑人买履", meaning: "只相信死规矩，不根据实际情况变通。", scene: "买鞋的人只信量好的尺码，忘带尺码就不肯用脚试鞋" },
  { idiom: "班门弄斧", meaning: "在真正的行家面前卖弄本领。", scene: "刚学会一点木工，就跑到木匠祖师鲁班门前展示斧工" },
  { idiom: "对牛弹琴", meaning: "没有根据对象选择合适的表达方法。", scene: "琴声虽然好听，牛却听不懂，仍然低头吃草" },
  { idiom: "囫囵吞枣", meaning: "学习时不理解内容，只是笼统接受。", scene: "吃枣时整个吞下去，连枣是什么味道都不知道" },
  { idiom: "胸有成竹", meaning: "做事前已经有完整的想法和准备。", scene: "画家长期观察竹子，下笔前心里已经有一幅竹子的样子" },
  { idiom: "熟能生巧", meaning: "练习得多了，就能找到巧妙的方法。", scene: "每天坚持练习投球，动作越来越准确也越来越轻松" },
  { idiom: "水滴石穿", meaning: "坚持做小事，时间久了也能产生大力量。", scene: "一滴滴水落在同一个地方，最后连坚硬的石头也留下小洞" },
  { idiom: "坚持不懈", meaning: "一直努力，不因为困难而放弃。", scene: "每天练十分钟跳绳，遇到失败也继续尝试" },
  { idiom: "专心致志", meaning: "把全部心思放在一件事情上。", scene: "写作业时收起玩具，认真完成眼前的题目" },
  { idiom: "全神贯注", meaning: "注意力非常集中。", scene: "观察小蚂蚁搬家时，看得认真又仔细" },
  { idiom: "聚精会神", meaning: "集中精神，认真做事。", scene: "听老师讲故事时，大家安静地看着老师" },
  { idiom: "勤学好问", meaning: "认真学习，遇到不懂的主动提问。", scene: "发现生字不会读，就查字典并请教老师" },
  { idiom: "学以致用", meaning: "把学到的知识用到实际生活中。", scene: "学会测量后，自己量出书桌的长度" },
  { idiom: "举一反三", meaning: "从一件事想到其他相似的事情。", scene: "学会一种加法后，能自己解决几道相似的题" },
  { idiom: "循序渐进", meaning: "按照顺序一步一步提高。", scene: "先练横和竖，再学习结构更复杂的汉字" },
  { idiom: "日积月累", meaning: "每天积累一点，时间久了就会很多。", scene: "每天认识两个新字，一年后就能读很多故事" },
  { idiom: "开卷有益", meaning: "认真读书总会得到收获。", scene: "翻开一本好书，可以认识新朋友和新世界" },
  { idiom: "百闻不如一见", meaning: "听很多次，也不如亲眼看一次清楚。", scene: "听别人介绍长城后，又亲自去观察它的样子", ageBand: "9-10" },
  { idiom: "见多识广", meaning: "看得多、经历得多，知道的事情也多。", scene: "常读书和参观博物馆，能了解不同地方的知识" },
  { idiom: "博大精深", meaning: "内容丰富，知识深厚。", scene: "汉字文化有很长的历史，也有许多值得探索的知识", ageBand: "9-10" },
  { idiom: "同心协力", meaning: "大家心往一处想，一起努力。", scene: "小组成员分工合作，很快完成了大拼图" },
  { idiom: "齐心协力", meaning: "许多人朝同一个目标共同努力。", scene: "同学们一起整理图书角，有人分类有人摆放" },
  { idiom: "助人为乐", meaning: "帮助别人，并从中感到快乐。", scene: "看到同学搬不动书，主动上前搭把手" },
  { idiom: "雪中送炭", meaning: "在别人最需要时给予帮助。", scene: "下雨时朋友没有伞，把自己的伞分给他一起用" },
  { idiom: "锦上添花", meaning: "在已经很好的事情上再增加美好。", scene: "精彩的节目配上合适的音乐，变得更加动人" },
  { idiom: "和睦相处", meaning: "彼此友好，愉快地生活或学习。", scene: "同学之间互相尊重，有不同意见也好好商量" },
  { idiom: "诚实守信", meaning: "说真话，并且遵守答应过的事情。", scene: "不小心弄坏东西后主动承认，并认真想办法补救" },
  { idiom: "言而有信", meaning: "说过的话能够做到。", scene: "答应周末归还图书，就按时把书送回来" },
  { idiom: "一诺千金", meaning: "答应别人的事情非常有分量，一定做到。", scene: "虽然完成约定不容易，仍然努力兑现自己的承诺" },
  { idiom: "知错就改", meaning: "知道自己错了，就及时改正。", scene: "发现作业写错后认真订正，还弄懂了错误原因" },
  { idiom: "取长补短", meaning: "学习别人的优点，弥补自己的不足。", scene: "向书写工整的同学学习布局，也分享自己的朗读方法" },
  { idiom: "扬长避短", meaning: "发挥自己的长处，避开或改进不足。", scene: "小组活动时根据每个人擅长的事情合理分工" },
  { idiom: "独一无二", meaning: "只有这一个，没有完全相同的。", scene: "每个孩子都有自己的想法和闪光点" },
  { idiom: "五颜六色", meaning: "颜色很多，非常丰富。", scene: "花园里开着红、黄、蓝、紫等各种颜色的花" },
  { idiom: "鸟语花香", meaning: "鸟儿歌唱、花儿芳香，景色很美。", scene: "春天的公园里能听见鸟叫，也能闻到花香" },
  { idiom: "春暖花开", meaning: "春天天气温暖，花儿开放。", scene: "天气渐渐暖和，小草发芽，花朵一朵朵开放" },
] as const;

export const HANZI_IDIOMS: readonly IdiomLesson[] = [
  ...CORE_IDIOMS,
  ...ADDITIONAL_IDIOMS.map(buildIdiomLesson),
];

function buildIdiomLesson(seed: IdiomSeed): IdiomLesson {
  const keyChar = [...seed.idiom][0];
  return {
    id: pinyin(seed.idiom, { toneType: "none" }).replaceAll(" ", "-"),
    idiom: seed.idiom,
    pinyin: pinyin(seed.idiom, { toneType: "symbol" }),
    meaning: seed.meaning,
    origin: "传统成语故事和日常用法",
    story: `${seed.scene}。这个小故事提醒我们：${seed.meaning}遇到相似事情时，可以先想想这个成语，再决定怎样行动。`,
    example: `${seed.scene}，这可以用“${seed.idiom}”来表达。`,
    keyChars: [...seed.idiom],
    ageBand: seed.ageBand ?? "6-8",
    quiz: [
      { type: "meaning-choice", prompt: `“${seed.idiom}”是什么意思？`, choices: [seed.meaning, "只看表面，不用认真思考。", "什么事情都不用做。"], answer: seed.meaning },
      { type: "usage-choice", prompt: `哪件事适合使用“${seed.idiom}”？`, choices: [seed.scene, "随手放下东西就离开。", "没有听清问题就乱回答。"], answer: seed.scene },
      { type: "key-char", prompt: `说出“${seed.idiom}”中的一个关键字。`, answer: keyChar },
    ],
  };
}

export function getIdiomForHanzi(char: string, ageBand?: IdiomAgeBand): IdiomLesson | null {
  return (
    HANZI_IDIOMS.find(
      (lesson) => lesson.keyChars.includes(char) && (!ageBand || lesson.ageBand === ageBand),
    ) ?? null
  );
}
import { pinyin } from "pinyin-pro";
