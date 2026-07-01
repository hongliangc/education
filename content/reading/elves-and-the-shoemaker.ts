// The Elves and the Shoemaker（格林童话，公有领域）。
// English is adapted from Project Gutenberg #2591 Grimm's Fairy Tales; Chinese is project-authored.
import type { BilingualStory, ReadingIllustration, ReadingSentence } from "./types";

const ID = "elves-and-the-shoemaker";
const audio = (n: number): string => `/audio/reading/${ID}/${String(n).padStart(2, "0")}.mp3`;
const image = (n: number): string => `/images/reading/${ID}/${String(n).padStart(2, "0")}.png`;

const LINES: ReadonlyArray<readonly [string, string]> = [
  ["There was once a shoemaker who had grown so poor that he had only leather enough for one pair of shoes.", "从前有一个鞋匠，穷得只剩下够做一双鞋的皮料。"],
  ["In the evening he cut out the leather and laid it on his bench.", "晚上，他把皮料裁好，放在工作台上。"],
  ["He meant to rise early and sew the shoes in the morning.", "他打算第二天一早起来把鞋缝好。"],
  ["But when he got up, the shoes stood finished on the bench.", "可是他起床时，鞋子已经做好，整齐地摆在工作台上。"],
  ["The stitches were so neat that everyone admired them.", "针脚细密漂亮，人人都称赞。"],
  ["A customer bought the shoes at once and paid more than the usual price.", "一位顾客立刻买下鞋子，还付了比平常更多的钱。"],
  ["With the money, the shoemaker bought leather for two more pairs.", "鞋匠用这笔钱买了能做两双鞋的皮料。"],
  ["Again he cut the leather at night, and again the shoes were finished by morning.", "他又在夜里裁好皮料，第二天早上鞋子又做好了。"],
  ["This went on until the shoemaker and his wife were no longer poor.", "这样的事一直发生，直到鞋匠和妻子不再贫穷。"],
  ["One night they hid behind a curtain to see who helped them.", "一天夜里，他们躲在帘子后面，想看看是谁在帮忙。"],
  ["Two tiny elves came in and worked merrily until the shoes were done.", "两个小精灵走进来，快活地工作，直到鞋子完成。"],
  ["The wife said, “They have made us rich; we must thank them.”", "妻子说：“他们让我们过上好日子，我们一定要感谢他们。”"],
  ["She made little coats, shirts, stockings, and shoes for the elves.", "她给小精灵做了小外套、小衬衫、小袜子和小鞋子。"],
  ["When the elves found the gifts, they danced for joy and never came back to work.", "小精灵发现礼物后，高兴地跳起舞来，从此不再回来工作。"],
  ["But the shoemaker prospered in all that he did.", "不过鞋匠从此做什么都很顺利。"],
];

export const elvesAndTheShoemaker: BilingualStory = {
  id: ID,
  titleEn: "The Elves and the Shoemaker",
  titleZh: "小精灵和鞋匠",
  emoji: "🧝",
  level: "tale",
  sentences: LINES.map(([en, zh], i): ReadingSentence => ({ id: `s${String(i + 1).padStart(2, "0")}`, en, zh, audio: audio(i + 1) })),
  illustrations: [
    { src: image(1), alt: "The poor shoemaker prepares his last leather.", fromSentenceId: "s01" },
    { src: image(2), alt: "The shoemaker and his wife watch two tiny elves working.", fromSentenceId: "s10" },
    { src: image(3), alt: "The elves discover their little new clothes and shoes.", fromSentenceId: "s13" },
  ] satisfies ReadingIllustration[],
};
