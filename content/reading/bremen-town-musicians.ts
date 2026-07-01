// The Bremen Town Musicians / The Travelling Musicians（格林童话，公有领域）。
// English is adapted from Project Gutenberg #2591 Grimm's Fairy Tales; Chinese is project-authored.
import type { BilingualStory, ReadingIllustration, ReadingSentence } from "./types";

const ID = "bremen-town-musicians";
const audio = (n: number): string => `/audio/reading/${ID}/${String(n).padStart(2, "0")}.mp3`;
const image = (n: number): string => `/images/reading/${ID}/${String(n).padStart(2, "0")}.png`;

const LINES: ReadonlyArray<readonly [string, string]> = [
  ["An old donkey had worked hard for many years, but now his strength was failing.", "一头老驴辛苦工作了许多年，如今力气渐渐衰弱。"],
  ["His master thought he was no longer useful, so the donkey ran away toward Bremen.", "主人觉得他没用了，于是老驴朝不来梅逃去。"],
  ["He hoped to become a town musician there.", "他希望在那里当一名城市音乐家。"],
  ["On the road he met an old dog lying by the path.", "路上，他遇见一只躺在路边的老狗。"],
  ["“Come with me to Bremen,” said the donkey.", "“跟我去不来梅吧，”老驴说。"],
  ["Soon they met a cat whose face was as sad as three rainy days.", "不久，他们遇见一只猫，脸色像连下了三天雨一样忧伤。"],
  ["The cat joined them, and then they found a rooster crying loudly on a gate.", "猫也加入了他们，接着他们又发现一只公鸡在门上大声啼叫。"],
  ["The four friends walked until night came and a light shone through the forest.", "四个朋友一直走到夜幕降临，看见森林里有一盏灯光。"],
  ["They crept to the window and saw robbers eating at a table.", "他们悄悄来到窗前，看见强盗们正在桌边吃饭。"],
  ["The donkey put his forefeet on the window, the dog climbed on his back, the cat climbed on the dog, and the rooster flew to the top.", "老驴把前蹄搭上窗台，狗爬到驴背上，猫爬到狗身上，公鸡飞到最上面。"],
  ["Then they all made music at once: braying, barking, mewing, and crowing.", "然后他们一起演奏：驴叫、狗吠、猫叫、鸡鸣。"],
  ["The robbers were so frightened that they ran into the forest.", "强盗们吓坏了，逃进了森林。"],
  ["The friends ate the supper and settled down in the house.", "朋友们吃了晚饭，在屋子里住了下来。"],
  ["When a robber returned later, the animals drove him out again.", "后来一个强盗回来察看，动物们又把他赶了出去。"],
  ["So the musicians stayed happily in the house and did not go to Bremen after all.", "于是这些音乐家快乐地住在屋子里，最后并没有去不来梅。"],
];

export const bremenTownMusicians: BilingualStory = {
  id: ID,
  titleEn: "The Bremen Town Musicians",
  titleZh: "不来梅的音乐家",
  emoji: "🎺",
  level: "tale",
  sentences: LINES.map(([en, zh], i): ReadingSentence => ({ id: `s${String(i + 1).padStart(2, "0")}`, en, zh, audio: audio(i + 1) })),
  illustrations: [
    { src: image(1), alt: "The old donkey starts down the road to Bremen.", fromSentenceId: "s01" },
    { src: image(2), alt: "The four animal friends see a light in the forest.", fromSentenceId: "s08" },
    { src: image(3), alt: "The animals stack themselves at the robbers' window.", fromSentenceId: "s10" },
  ] satisfies ReadingIllustration[],
};
