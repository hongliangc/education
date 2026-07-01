// The Frog Prince（格林童话，公有领域）。
// English is adapted from Project Gutenberg #2591 Grimm's Fairy Tales; Chinese is project-authored.
import type { BilingualStory, ReadingIllustration, ReadingSentence } from "./types";

const ID = "frog-prince";
const audio = (n: number): string => `/audio/reading/${ID}/${String(n).padStart(2, "0")}.mp3`;
const image = (n: number): string => `/images/reading/${ID}/${String(n).padStart(2, "0")}.png`;

const LINES: ReadonlyArray<readonly [string, string]> = [
  ["In old times a king's youngest daughter had a golden ball.", "很久以前，一位国王最小的女儿有一个金球。"],
  ["She loved to play with it beside a deep spring in the forest.", "她喜欢在森林里一口深泉旁玩这个球。"],
  ["One day the ball fell into the water and sank out of sight.", "有一天，金球掉进水里，沉得看不见了。"],
  ["The princess began to cry, and a frog put his head out of the spring.", "公主哭了起来，一只青蛙从泉水里探出头。"],
  ["“What will you give me if I bring back your ball?” asked the frog.", "“如果我把球取回来，你会给我什么？”青蛙问。"],
  ["“Anything you want,” said the princess.", "“你想要什么都可以，”公主说。"],
  ["The frog asked to be her friend, to eat from her plate, and to sleep near her bed.", "青蛙要求做她的朋友，和她同盘吃饭，还要睡在她床边。"],
  ["The princess promised, though she did not mean to keep her word.", "公主答应了，虽然她并不打算守信。"],
  ["The frog dived down and brought up the golden ball.", "青蛙潜入水中，把金球带了上来。"],
  ["The princess took the ball and ran home.", "公主拿起金球就跑回了家。"],
  ["That evening the frog came to the palace door and asked to come in.", "当天晚上，青蛙来到宫门前，请求进去。"],
  ["The king told his daughter that a promise must be kept.", "国王告诉女儿，许下的诺言必须遵守。"],
  ["So the frog ate from her plate and stayed beside her.", "于是青蛙和她同盘吃饭，还留在她身边。"],
  ["At last the spell was broken, and the frog became a prince with kind eyes.", "最后魔法解除了，青蛙变成了一位眼神温和的王子。"],
  ["The princess learned that promises are not little things.", "公主明白了，承诺绝不是小事。"],
];

export const frogPrince: BilingualStory = {
  id: ID,
  titleEn: "The Frog Prince",
  titleZh: "青蛙王子",
  emoji: "🐸",
  level: "tale",
  sentences: LINES.map(([en, zh], i): ReadingSentence => ({ id: `s${String(i + 1).padStart(2, "0")}`, en, zh, audio: audio(i + 1) })),
  illustrations: [
    { src: image(1), alt: "The princess plays with her golden ball near the spring.", fromSentenceId: "s01" },
    { src: image(2), alt: "The frog speaks to the crying princess.", fromSentenceId: "s04" },
    { src: image(3), alt: "The frog's spell breaks and he becomes a prince.", fromSentenceId: "s14" },
  ] satisfies ReadingIllustration[],
};
