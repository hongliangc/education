// The Ants and the Grasshopper（伊索寓言，公有领域）。
// English is adapted from Project Gutenberg #19994 The Aesop for Children; Chinese is project-authored.
import type { BilingualStory, ReadingIllustration, ReadingSentence } from "./types";

const ID = "ants-and-the-grasshopper";
const audio = (n: number): string => `/audio/reading/${ID}/${String(n).padStart(2, "0")}.mp3`;
const image = (n: number): string => `/images/reading/${ID}/${String(n).padStart(2, "0")}.png`;

const LINES: ReadonlyArray<readonly [string, string]> = [
  ["One bright summer day a Grasshopper was hopping about and singing with all his heart.", "一个明亮的夏日，蚱蜢一边跳来跳去，一边尽情歌唱。"],
  ["An Ant passed by, carrying an ear of corn to her nest.", "一只蚂蚁经过，正把一穗谷物搬回窝里。"],
  ["“Why not come and chat with me?” said the Grasshopper.", "“为什么不来和我聊聊天呢？”蚱蜢说。"],
  ["“I am helping to store food for the winter,” said the Ant.", "“我正在帮忙储存过冬的食物，”蚂蚁说。"],
  ["“You should do the same.”", "“你也应该这样做。”"],
  ["“Why worry about winter?” said the Grasshopper.", "“为什么要担心冬天呢？”蚱蜢说。"],
  ["“We have plenty of food at present.”", "“现在我们有很多食物呀。”"],
  ["But the Ant went on with her work.", "可是蚂蚁继续忙着工作。"],
  ["When winter came, the Grasshopper found himself cold and hungry.", "冬天来了，蚱蜢又冷又饿。"],
  ["He saw the Ants sharing the food they had gathered in the summer.", "他看到蚂蚁们正在分享夏天储存的食物。"],
  ["Then the Grasshopper knew that it is best to prepare for days of need.", "这时蚱蜢才明白，应该为困难的日子早做准备。"],
];

export const antsAndTheGrasshopper: BilingualStory = {
  id: ID,
  titleEn: "The Ants and the Grasshopper",
  titleZh: "蚂蚁和蚱蜢",
  emoji: "🐜",
  level: "fable",
  sentences: LINES.map(([en, zh], i): ReadingSentence => ({ id: `s${String(i + 1).padStart(2, "0")}`, en, zh, audio: audio(i + 1) })),
  illustrations: [
    { src: image(1), alt: "The Grasshopper sings in the summer grass.", fromSentenceId: "s01" },
    { src: image(2), alt: "The Ant carries food back to the nest.", fromSentenceId: "s02" },
    { src: image(3), alt: "In winter the Grasshopper stands cold outside the Ants' home.", fromSentenceId: "s09" },
  ] satisfies ReadingIllustration[],
};
