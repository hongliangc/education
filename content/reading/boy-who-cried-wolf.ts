// The Shepherd Boy and the Wolf（伊索寓言，公有领域）。
// English is adapted from Project Gutenberg #19994 The Aesop for Children; Chinese is project-authored.
import type { BilingualStory, ReadingIllustration, ReadingSentence } from "./types";

const ID = "boy-who-cried-wolf";
const audio = (n: number): string => `/audio/reading/${ID}/${String(n).padStart(2, "0")}.mp3`;
const image = (n: number): string => `/images/reading/${ID}/${String(n).padStart(2, "0")}.png`;

const LINES: ReadonlyArray<readonly [string, string]> = [
  ["A Shepherd Boy tended his master's sheep near a dark forest, not far from the village.", "一个牧童在离村子不远的黑森林旁，替主人放羊。"],
  ["One day he thought he would play a trick on the villagers.", "有一天，他想捉弄一下村民。"],
  ["He ran toward the village crying, “Wolf! Wolf!”", "他朝村子跑去，大喊：“狼来了！狼来了！”"],
  ["The villagers left their work and ran to the pasture to help him.", "村民们放下手里的活，跑到牧场来帮他。"],
  ["But when they arrived, the boy only laughed at them.", "可是他们赶到时，牧童只是哈哈大笑。"],
  ["A few days later he cried again, “Wolf! Wolf!”", "几天后，他又喊：“狼来了！狼来了！”"],
  ["Again the villagers ran to save the sheep, and again the boy laughed.", "村民们又跑来救羊，牧童又一次笑话他们。"],
  ["Then a real wolf came from the forest and began to chase the sheep.", "后来，一只真正的狼从森林里出来，开始追赶羊群。"],
  ["The terrified boy ran toward the village shouting louder than ever.", "吓坏了的牧童跑向村子，比以前喊得更大声。"],
  ["“Wolf! Wolf! Please come and help!” he cried.", "“狼来了！狼来了！请快来帮忙！”他喊道。"],
  ["But the villagers thought he was trying to fool them again.", "可是村民们以为他又在骗人。"],
  ["No one came, and the wolf carried off many of the sheep.", "没有人来，狼叼走了许多羊。"],
  ["Liars are not believed even when they tell the truth.", "说谎的人，即使说真话也不会被相信。"],
];

export const boyWhoCriedWolf: BilingualStory = {
  id: ID,
  titleEn: "The Boy Who Cried Wolf",
  titleZh: "牧童和狼",
  emoji: "🐺",
  level: "fable",
  sentences: LINES.map(([en, zh], i): ReadingSentence => ({ id: `s${String(i + 1).padStart(2, "0")}`, en, zh, audio: audio(i + 1) })),
  illustrations: [
    { src: image(1), alt: "The shepherd boy watches sheep near the forest.", fromSentenceId: "s01" },
    { src: image(2), alt: "The boy tricks the villagers by crying wolf.", fromSentenceId: "s03" },
    { src: image(3), alt: "A real wolf runs from the forest toward the sheep.", fromSentenceId: "s08" },
  ] satisfies ReadingIllustration[],
};
