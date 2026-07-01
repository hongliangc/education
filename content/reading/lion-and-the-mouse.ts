// 试点篇目：狮子与老鼠 The Lion and the Mouse（伊索寓言，公有领域）。
// 英文采用 Project Gutenberg #19994 The Aesop for Children 的公版正文；中文为本项目逐句译文。
// 仅 `import type`（编译期擦除）→ 本文件可被 Node 原生 TS 运行器直接加载（离线 Polly dump 脚本用）。
import type { BilingualStory, ReadingIllustration, ReadingSentence } from "./types";

const ID = "lion-and-the-mouse";
const audio = (n: number): string => `/audio/reading/${ID}/${String(n).padStart(2, "0")}.mp3`;
const image = (n: number): string => `/images/reading/${ID}/${String(n).padStart(2, "0")}.png`;

const LINES: ReadonlyArray<readonly [string, string]> = [
  ["A Lion lay asleep in the forest, his great head resting on his paws.", "一只狮子在森林里睡着了，巨大的头枕在爪子上。"],
  ["A timid little Mouse came upon him unexpectedly, and in her fright and haste to get away, ran across the Lion's nose.", "一只胆小的小老鼠突然碰见了他，又害怕又急着逃走，竟从狮子的鼻子上跑了过去。"],
  ["Roused from his nap, the Lion laid his huge paw angrily on the tiny creature to kill her.", "狮子从午睡中惊醒，生气地用巨大的爪子按住这个小家伙，想要杀死她。"],
  ["“Spare me!” begged the poor Mouse.", "“饶了我吧！”可怜的小老鼠哀求道。"],
  ["“Please let me go and some day I will surely repay you.”", "“请放我走吧，总有一天我一定会报答你的。”"],
  ["The Lion was much amused to think that a Mouse could ever help him.", "狮子想到一只老鼠竟然能帮上自己的忙，觉得非常好笑。"],
  ["But he was generous and finally let the Mouse go.", "但他很宽宏大量，最后还是放走了小老鼠。"],
  ["Some days later, while stalking his prey in the forest, the Lion was caught in the toils of a hunter's net.", "几天后，狮子在森林里悄悄追踪猎物时，被猎人的网困住了。"],
  ["Unable to free himself, he filled the forest with his angry roaring.", "他无法挣脱，愤怒的吼声响彻了整片森林。"],
  ["The Mouse knew the voice and quickly found the Lion struggling in the net.", "小老鼠认出了这个声音，很快找到了在网中挣扎的狮子。"],
  ["Running to one of the great ropes that bound him, she gnawed it until it parted, and soon the Lion was free.", "她跑到绑住狮子的一根粗绳旁，不停地啃咬，直到绳子断开，很快狮子就自由了。"],
  ["“You laughed when I said I would repay you,” said the Mouse.", "“我说会报答你时，你还笑了呢，”小老鼠说。"],
  ["“Now you see that even a Mouse can help a Lion.”", "“现在你看到了，就算是一只老鼠，也能帮助一只狮子。”"],
  ["A kindness is never wasted.", "善意从来不会白费。"],
];

const sentences: ReadingSentence[] = LINES.map(([en, zh], i) => ({
  id: `s${String(i + 1).padStart(2, "0")}`,
  en,
  zh,
  audio: audio(i + 1),
}));

const illustrations: ReadingIllustration[] = [
  {
    src: image(1),
    alt: "The lion holds up his paw while the little mouse asks to go free.",
    fromSentenceId: "s01",
  },
  {
    src: image(2),
    alt: "The lion is caught in a net and the little mouse runs to help.",
    fromSentenceId: "s08",
  },
  {
    src: image(3),
    alt: "The lion bows kindly to the mouse after she frees him.",
    fromSentenceId: "s12",
  },
];

export const lionAndTheMouse: BilingualStory = {
  id: ID,
  titleEn: "The Lion and the Mouse",
  titleZh: "狮子与老鼠",
  emoji: "🦁",
  level: "fable",
  sentences,
  illustrations,
};
