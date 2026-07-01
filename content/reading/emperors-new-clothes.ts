// The Emperor's New Clothes（安徒生童话，公有领域）。
// English is adapted from Project Gutenberg #1597 The Andersen Fairy Tales; Chinese is project-authored.
import type { BilingualStory, ReadingIllustration, ReadingSentence } from "./types";

const ID = "emperors-new-clothes";
const audio = (n: number): string => `/audio/reading/${ID}/${String(n).padStart(2, "0")}.mp3`;
const image = (n: number): string => `/images/reading/${ID}/${String(n).padStart(2, "0")}.png`;

const LINES: ReadonlyArray<readonly [string, string]> = [
  ["Many years ago there was an Emperor who cared for nothing so much as new clothes.", "许多年前，有一位皇帝最在意的就是新衣服。"],
  ["He spent all his money on dressing well and changing his clothes every hour.", "他把钱都花在穿得漂亮上，几乎每个时辰都要换衣服。"],
  ["One day two strangers came to the city and said they could weave the most wonderful cloth.", "一天，两个陌生人来到城里，说他们能织出最奇妙的布。"],
  ["They said the cloth was invisible to anyone who was foolish or unfit for his office.", "他们说，愚蠢或不称职的人看不见这种布。"],
  ["The Emperor thought this cloth would show him who was wise and who was not.", "皇帝觉得这种布可以让他看出谁聪明、谁不聪明。"],
  ["He gave the strangers gold, silk, and thread, but they put nothing on the looms.", "他给了陌生人金子、丝线和纱线，可他们什么也没放到织机上。"],
  ["The ministers came to look, but they saw only empty frames.", "大臣们来看，却只看见空空的架子。"],
  ["Still, each one praised the beautiful colors and the splendid pattern.", "可是每个人都称赞那美丽的颜色和华丽的花纹。"],
  ["At last the Emperor himself came, and he too saw nothing.", "最后皇帝亲自来了，他也什么都没看见。"],
  ["But he was afraid to seem foolish, so he praised the cloth loudly.", "但他害怕显得愚蠢，于是大声称赞这块布。"],
  ["On the day of the procession, the strangers pretended to dress him in the new clothes.", "游行那天，陌生人假装给他穿上新衣。"],
  ["The Emperor walked through the streets while all the people cheered.", "皇帝走过街道，所有人都欢呼起来。"],
  ["No one wanted to admit that they could see nothing.", "没有人愿意承认自己什么也看不见。"],
  ["Then a little child cried, “But he has nothing on!”", "这时，一个小孩喊道：“可是他什么也没穿呀！”"],
  ["The people whispered the truth, and the Emperor knew they were right.", "人们小声传开了真相，皇帝也知道他们说得对。"],
];

export const emperorsNewClothes: BilingualStory = {
  id: ID,
  titleEn: "The Emperor's New Clothes",
  titleZh: "皇帝的新装",
  emoji: "👑",
  level: "tale",
  sentences: LINES.map(([en, zh], i): ReadingSentence => ({ id: `s${String(i + 1).padStart(2, "0")}`, en, zh, audio: audio(i + 1) })),
  illustrations: [
    { src: image(1), alt: "The Emperor admires his many fine clothes.", fromSentenceId: "s01" },
    { src: image(2), alt: "The two strangers pretend to weave invisible cloth.", fromSentenceId: "s06" },
    { src: image(3), alt: "The Emperor walks in the procession while a child tells the truth.", fromSentenceId: "s11" },
  ] satisfies ReadingIllustration[],
};
