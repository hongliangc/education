// The North Wind and the Sun（伊索寓言，公有领域）。
// English is adapted from Project Gutenberg #19994 The Aesop for Children; Chinese is project-authored.
import type { BilingualStory, ReadingIllustration, ReadingSentence } from "./types";

const ID = "north-wind-and-the-sun";
const audio = (n: number): string => `/audio/reading/${ID}/${String(n).padStart(2, "0")}.mp3`;
const image = (n: number): string => `/images/reading/${ID}/${String(n).padStart(2, "0")}.png`;

const LINES: ReadonlyArray<readonly [string, string]> = [
  ["The North Wind and the Sun had a quarrel about which of them was the stronger.", "北风和太阳争论谁更强大。"],
  ["While they were disputing, a traveler came along wrapped in a warm cloak.", "他们争论时，一个披着厚斗篷的旅人走了过来。"],
  ["They agreed that the one who could make the traveler take off his cloak would be called stronger.", "他们约定，谁能让旅人脱下斗篷，谁就算更强。"],
  ["The North Wind blew as hard as he could.", "北风使出全力猛吹。"],
  ["But the harder he blew, the closer the traveler wrapped his cloak around him.", "可是风吹得越猛，旅人就把斗篷裹得越紧。"],
  ["At last the North Wind gave up the attempt.", "最后，北风只好放弃。"],
  ["Then the Sun shone out warmly from behind the clouds.", "接着，太阳从云后露出来，温暖地照耀着。"],
  ["Soon the traveler felt the pleasant warmth on his shoulders.", "很快，旅人感到肩头暖洋洋的。"],
  ["He loosened his cloak and then took it off.", "他松开斗篷，随后把它脱了下来。"],
  ["The Sun had won the contest.", "太阳赢得了比赛。"],
  ["Gentleness and kindness often do more than force.", "温和与善意，常常比蛮力更有用。"],
];

export const northWindAndTheSun: BilingualStory = {
  id: ID,
  titleEn: "The North Wind and the Sun",
  titleZh: "北风和太阳",
  emoji: "🌬️",
  level: "fable",
  sentences: LINES.map(([en, zh], i): ReadingSentence => ({ id: `s${String(i + 1).padStart(2, "0")}`, en, zh, audio: audio(i + 1) })),
  illustrations: [
    { src: image(1), alt: "The North Wind and the Sun argue in the sky.", fromSentenceId: "s01" },
    { src: image(2), alt: "The North Wind blows at the traveler in his cloak.", fromSentenceId: "s04" },
    { src: image(3), alt: "The Sun warms the traveler until he removes his cloak.", fromSentenceId: "s07" },
  ] satisfies ReadingIllustration[],
};
