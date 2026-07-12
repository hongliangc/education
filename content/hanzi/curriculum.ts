// @ts-expect-error Node's native TypeScript tests require the explicit extension.
import { HANZI_CATALOG, HANZI_LEVELS, type PrimaryGradeLevel } from "./catalog.ts";
import type { Grade } from "../../lib/grades.ts";

export const HANZI_STAGES = ["foundation", "life", "reading", "independent"] as const;
export type HanziStageId = (typeof HANZI_STAGES)[number];

export interface HanziUnitAssessment {
  understand: string;
  fluent: string;
  master: string;
  apply: string;
}

export interface HanziCurriculumUnit {
  id: string;
  stage: HanziStageId;
  title: string;
  objective: string;
  prerequisiteUnitIds: readonly string[];
  recommendedGrades: readonly Grade[];
  recognizeChars: readonly string[];
  writeChars: readonly string[];
  extensionChars: readonly string[];
  teachingOrder: readonly string[];
  assessments: HanziUnitAssessment;
}

interface UnitSeed {
  id: string;
  stage: HanziStageId;
  title: string;
  objective: string;
  chars: string;
  writeChars?: string;
  prerequisiteUnitIds?: readonly string[];
  recommendedGrades: readonly Grade[];
}

const CORE_UNIT_SEEDS: readonly UnitSeed[] = [
  seed("count-things", "foundation", "我会数一数", "能够认读生活中的基本数字和数量", "一二三四五六七八九十零两百千万个只半", "一二三四五六七八九十", [], ["K1", "K2", "K3", "G1"]),
  seed("know-myself", "foundation", "我会认识自己", "能够指出并说出人物和身体的常见汉字", "人口手足耳目牙头脸嘴心身体脑男女孩", "人口手足耳目", ["count-things"], ["K1", "K2", "K3", "G1"]),
  seed("compare-things", "foundation", "我会比较事物", "能够用汉字比较大小、多少、长短和高低", "大小多少高低长短轻快慢远近", "大小多少中", ["count-things"], ["K2", "K3", "G1"]),
  seed("find-directions", "foundation", "我会辨方向", "能够根据位置认读并使用常见方向字", "上下左右东西南北中里外前后边旁", "上下左右中", ["compare-things"], ["K2", "K3", "G1"]),
  seed("discover-weather", "foundation", "我会看天气", "能够从天气和天空场景中认读相关汉字", "天日月云风雨雪晴阴阳冷热凉", "天日月云雨", ["find-directions"], ["K2", "K3", "G1"]),
  seed("discover-nature", "foundation", "我会认识自然", "能够认读身边自然景物和基本物质", "山水火木土田花草树森林河海星光", "山水火木土田", ["discover-weather"], ["K2", "K3", "G1"]),
  seed("meet-family", "foundation", "我会介绍家人", "能够认读家庭成员和熟悉人物的称呼", "家爸妈爷奶哥姐弟妹儿子朋友老师同学", "家爸妈", ["know-myself"], ["K2", "K3", "G1"]),
  seed("tell-time", "life", "我会说时间", "能够认读日常时间、日期和先后顺序", "年月日早晚今明午晨岁周期春夏秋冬", "年月日早晚", ["discover-weather"], ["G1", "G2"]),
  seed("go-to-school", "life", "我会去学校", "能够认读课堂学习和校园生活中的常见字", "学校书本笔课班教读写问答题考认知记图文", "学校书本", ["meet-family"], ["G1", "G2"]),
  seed("do-actions", "life", "我会说动作", "能够认读并使用日常活动和操作的动词", "走跑看听说读写拿放开关进出回去来坐站做打找给跟穿洗睡吃喝玩休飞唱", "走看听说读写", ["go-to-school"], ["G1", "G2"]),
  seed("eat-and-live", "life", "我会说衣食住行", "能够认读衣服、食物、住所和出行场景", "衣服饭菜蛋肉米茶水果门房楼院店馆车船汽路票", "衣饭门车", ["do-actions"], ["G1", "G2"]),
  seed("share-feelings", "life", "我会表达感受", "能够认读并表达常见情绪、感受和状态", "爱好笑哭怕累快乐高兴欢喜气病饿疼舒难忙", "爱好乐", ["meet-family"], ["G1", "G2"]),
  seed("know-animals", "life", "我会认识动物", "能够认读生活和故事中的常见动物", "虫鱼鸟马牛羊鸡", "虫鱼鸟马牛羊", ["discover-nature"], ["G1", "G2"]),
  seed("describe-colors-shapes", "life", "我会描述样子", "能够用颜色、形状和外观汉字描述事物", "红白黑黄蓝绿颜色形状圆条片角亮", "白红", ["compare-things"], ["G1", "G2", "G3"]),
  seed("read-relations", "reading", "我会读懂关系", "能够理解句子中的指代、连接、条件和关系", "不有得是的了在也和与为于如但因所其这那他我你们自相可会能要", "不有是的在", ["go-to-school"], ["G2", "G3"]),
  seed("read-changes", "reading", "我会读懂变化", "能够理解变化、过程、结果和程度的表达", "重变成起到过完再还已更最越满差错正坏", "成起到", ["read-relations"], ["G2", "G3"]),
  seed("read-information", "reading", "我会读懂说明", "能够从短文中提取名称、数量、方法和重要信息", "名称数表法方式内容结果原因例说明信息知识", "名数", ["read-relations"], ["G3"]),
  seed("read-community", "reading", "我会阅读社会生活", "能够理解城市、乡村、公共场所和社会活动的常见表达", "国城村京市公商医院工场道路交通店馆", "国城", ["read-information"], ["G3"]),
  seed("think-and-explain", "independent", "我会思考和解释", "能够认读表达观察、思考、判断和观点的汉字", "观察想象发现创造思考论理判断理解懂", "思", ["read-information"], ["G3"]),
  seed("values-and-cooperation", "independent", "我会理解品格与合作", "能够理解责任、合作、坚持、希望和帮助等品格表达", "保护环境责任合作坚持希望梦愿帮助勇敢安静", "心", ["think-and-explain"], ["G3"]),
  seed("read-culture-science", "independent", "我会阅读文化与科学", "能够阅读文化、艺术、科学和自然探究主题的常见字", "故事音乐语言祖先世界未来科学电光", "文", ["think-and-explain"], ["G3"]),
] as const;

const FALLBACK_UNITS: readonly Omit<UnitSeed, "chars">[] = [
  seedWithoutChars("use-everyday-language", "life", "我会读懂日常对话", "能够认读日常问答、请求和回应中的高频字", ["do-actions"], ["G1", "G2"]),
  seedWithoutChars("read-life-scenes", "life", "我会阅读生活场景", "能够从家庭、校园和出行短句中提取信息", ["eat-and-live"], ["G1", "G2", "G3"]),
  seedWithoutChars("read-short-stories", "reading", "我会阅读短故事", "能够理解人物、动作、顺序和结果组成的短故事", ["read-changes"], ["G2", "G3"]),
  seedWithoutChars("read-explanations", "reading", "我会阅读说明文字", "能够理解描述、比较、分类和说明中的常见书面字", ["read-information"], ["G3"]),
  seedWithoutChars("read-public-information", "independent", "我会阅读公共信息", "能够理解公共场所、规则、通知和生活信息", ["read-community"], ["G3"]),
  seedWithoutChars("read-complex-texts", "independent", "我会阅读综合文章", "能够综合运用已学字理解较复杂的叙述和说明", ["read-culture-science"], ["G3"]),
] as const;

export const HANZI_UNITS: readonly HanziCurriculumUnit[] = buildCurriculum();

const UNIT_BY_CHAR = new Map(HANZI_UNITS.flatMap((unit) => unit.recognizeChars.map((char) => [char, unit] as const)));

export function getHanziUnit(char: string): HanziCurriculumUnit | undefined {
  return UNIT_BY_CHAR.get(char);
}

export function getUnitsForStage(stage: HanziStageId): HanziCurriculumUnit[] {
  return HANZI_UNITS.filter((unit) => unit.stage === stage);
}

function buildCurriculum(): HanziCurriculumUnit[] {
  const catalogChars = new Set(HANZI_CATALOG.map((item) => item.char));
  const assigned = new Set<string>();
  const units: HanziCurriculumUnit[] = [];

  for (const unitSeed of CORE_UNIT_SEEDS) {
    const chars = [...new Set(unitSeed.chars)].filter((char) => catalogChars.has(char) && !assigned.has(char));
    if (chars.length === 0) continue;
    chars.forEach((char) => assigned.add(char));
    units.push(toUnit(unitSeed, chars));
  }

  const fallbackByLevel: Record<PrimaryGradeLevel, string> = {
    G1: "use-everyday-language",
    G2: "read-life-scenes",
    G3: "read-short-stories",
    G4: "read-explanations",
    G5: "read-public-information",
    G6: "read-complex-texts",
  };
  for (const [index, fallback] of FALLBACK_UNITS.entries()) {
    const level = HANZI_LEVELS[index];
    const chars = HANZI_CATALOG.filter((item) => item.level === level && !assigned.has(item.char)).map((item) => item.char);
    const uniqueChars = [...new Set(chars)];
    uniqueChars.forEach((char) => assigned.add(char));
    units.push(toUnit({ ...fallback, chars: uniqueChars.join(""), id: fallbackByLevel[level] }, uniqueChars));
  }

  return units;
}

function toUnit(unitSeed: UnitSeed, chars: readonly string[]): HanziCurriculumUnit {
  const writeChars = [...(unitSeed.writeChars ?? "")].filter((char) => chars.includes(char));
  return {
    id: unitSeed.id,
    stage: unitSeed.stage,
    title: unitSeed.title,
    objective: unitSeed.objective,
    prerequisiteUnitIds: unitSeed.prerequisiteUnitIds ?? [],
    recommendedGrades: unitSeed.recommendedGrades,
    recognizeChars: chars,
    writeChars,
    extensionChars: [],
    teachingOrder: chars,
    assessments: {
      understand: "把汉字与读音、意思和具体场景建立联系，并用自己的方式说明",
      fluent: "完成两组无答案提示的练习，每组正确率至少 85%",
      master: "即时独立正确率至少 90%，并通过次日或更晚的延迟提取",
      apply: "在未见过的新场景中选择并使用所学字词，综合评分至少 80%",
    },
  };
}

function seed(id: string, stage: HanziStageId, title: string, objective: string, chars: string, writeChars: string, prerequisiteUnitIds: readonly string[], recommendedGrades: readonly Grade[]): UnitSeed {
  return { id, stage, title, objective, chars, writeChars, prerequisiteUnitIds, recommendedGrades };
}

function seedWithoutChars(id: string, stage: HanziStageId, title: string, objective: string, prerequisiteUnitIds: readonly string[], recommendedGrades: readonly Grade[]): Omit<UnitSeed, "chars"> {
  return { id, stage, title, objective, prerequisiteUnitIds, recommendedGrades };
}
