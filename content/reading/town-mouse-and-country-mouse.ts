// The Town Mouse and the Country Mouse（伊索寓言，公有领域）。
// English is adapted from Project Gutenberg #19994 The Aesop for Children; Chinese is project-authored.
import type { BilingualStory, ReadingIllustration, ReadingSentence } from "./types";

const ID = "town-mouse-and-country-mouse";
const audio = (n: number): string => `/audio/reading/${ID}/${String(n).padStart(2, "0")}.mp3`;
const image = (n: number): string => `/images/reading/${ID}/${String(n).padStart(2, "0")}.png`;

const LINES: ReadonlyArray<readonly [string, string]> = [
  ["A Town Mouse once visited a Country Mouse who lived in a field.", "一只城里老鼠去拜访住在田野里的乡下老鼠。"],
  ["The Country Mouse offered him beans, bacon, cheese, and bread.", "乡下老鼠请他吃豆子、熏肉、奶酪和面包。"],
  ["The Town Mouse turned up his long nose at this simple country food.", "城里老鼠对这些朴素的乡下食物很看不上。"],
  ["“You live very poorly here,” he said.", "“你在这里过得太清苦了，”他说。"],
  ["“Come with me to town, and I will show you fine living.”", "“跟我去城里吧，我会让你见识好日子。”"],
  ["So the two mice went to the great house where the Town Mouse lived.", "于是两只老鼠来到城里老鼠住的大房子。"],
  ["There they found cakes, jellies, and all sorts of dainty food.", "在那里，他们找到了蛋糕、果冻和各种精美食物。"],
  ["But just as they began to eat, the door flew open.", "可是他们刚开始吃，门突然打开了。"],
  ["People rushed in, and the frightened mice ran to hide.", "人们冲了进来，吓坏的老鼠赶紧躲藏。"],
  ["When the room was quiet again, they crept back to the feast.", "等房间又安静下来，他们才偷偷回到宴席旁。"],
  ["Then a cat sprang toward them, and they barely escaped with their lives.", "这时一只猫扑了过来，他们差点丢了性命。"],
  ["“Good-bye,” said the Country Mouse.", "“再见了，”乡下老鼠说。"],
  ["“I would rather eat plain food in peace than rich food in fear.”", "“我宁愿平静地吃粗茶淡饭，也不愿提心吊胆地吃美食。”"],
];

export const townMouseAndCountryMouse: BilingualStory = {
  id: ID,
  titleEn: "The Town Mouse and the Country Mouse",
  titleZh: "城里老鼠和乡下老鼠",
  emoji: "🐭",
  level: "fable",
  sentences: LINES.map(([en, zh], i): ReadingSentence => ({ id: `s${String(i + 1).padStart(2, "0")}`, en, zh, audio: audio(i + 1) })),
  illustrations: [
    { src: image(1), alt: "The Town Mouse visits the Country Mouse in a field.", fromSentenceId: "s01" },
    { src: image(2), alt: "The two mice feast inside a rich town house.", fromSentenceId: "s06" },
    { src: image(3), alt: "A cat leaps toward the frightened mice.", fromSentenceId: "s11" },
  ] satisfies ReadingIllustration[],
};
