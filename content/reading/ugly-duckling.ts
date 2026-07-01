// The Ugly Duckling（安徒生童话，公有领域）。
// English is adapted from public-domain English translations of Hans Christian Andersen; Chinese is project-authored.
import type { BilingualStory, ReadingIllustration, ReadingSentence } from "./types";

const ID = "ugly-duckling";
const audio = (n: number): string => `/audio/reading/${ID}/${String(n).padStart(2, "0")}.mp3`;
const image = (n: number): string => `/images/reading/${ID}/${String(n).padStart(2, "0")}.png`;

const LINES: ReadonlyArray<readonly [string, string]> = [
  ["It was lovely summer weather in the country, and the corn stood yellow in the fields.", "乡间正是美好的夏日，田野里的谷物金黄一片。"],
  ["In a quiet corner, a mother duck sat on her nest waiting for her eggs to hatch.", "在一个安静的角落里，鸭妈妈坐在窝上，等待鸭蛋孵化。"],
  ["At last the eggs cracked, and the little ducklings cried, “Peep, peep!”", "终于，蛋壳裂开了，小鸭子们叫着：“唧唧，唧唧！”"],
  ["One large egg was slower than the rest.", "有一个大蛋比其他蛋孵得慢。"],
  ["When it opened, out came a big, gray duckling who looked different from the others.", "它裂开时，出来的是一只又大又灰、和别人不一样的小鸭。"],
  ["The other ducks pecked him and called him ugly.", "其他鸭子啄他，还叫他丑小鸭。"],
  ["The poor duckling ran away through the marshes and fields.", "可怜的小鸭穿过沼泽和田野逃走了。"],
  ["He passed a hard autumn and a cold winter, lonely and afraid.", "他度过了艰难的秋天和寒冷的冬天，又孤单又害怕。"],
  ["When spring came, he saw three beautiful white swans on the water.", "春天来了，他看见三只美丽的白天鹅在水面上。"],
  ["He bent his head, expecting them to drive him away.", "他低下头，以为它们也会赶走自己。"],
  ["But in the clear water he saw his own reflection.", "可是在清澈的水里，他看见了自己的倒影。"],
  ["He was no longer a gray duckling, but a beautiful swan.", "他不再是一只灰色小鸭，而是一只美丽的天鹅。"],
  ["The children cried, “The new one is the most beautiful of all!”", "孩子们喊道：“新来的这一只最美！”"],
  ["Then the young swan felt glad, but not proud.", "年轻的天鹅感到快乐，却一点也不骄傲。"],
];

export const uglyDuckling: BilingualStory = {
  id: ID,
  titleEn: "The Ugly Duckling",
  titleZh: "丑小鸭",
  emoji: "🦆",
  level: "tale",
  sentences: LINES.map(([en, zh], i): ReadingSentence => ({ id: `s${String(i + 1).padStart(2, "0")}`, en, zh, audio: audio(i + 1) })),
  illustrations: [
    { src: image(1), alt: "The mother duck waits beside her nest in the reeds.", fromSentenceId: "s02" },
    { src: image(2), alt: "The lonely gray duckling runs away from the farmyard.", fromSentenceId: "s07" },
    { src: image(3), alt: "The duckling sees a beautiful swan in the water's reflection.", fromSentenceId: "s11" },
  ] satisfies ReadingIllustration[],
};
