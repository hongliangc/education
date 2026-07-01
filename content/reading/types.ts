// 双语阅读 (bilingual reading) data model. PURE TYPES ONLY — no value exports — so that story files and
// the registry can import it with `import type` (fully erased), which keeps them loadable by the Node
// native-TS runner (the offline Polly dump script) without explicit-extension resolution headaches.
//
// A story is a flat list of short sentences. Each sentence carries the English text (the thing the
// child reads + follows aloud), a Chinese translation (hidden until the child taps 「看中文」), and the
// path to its pre-generated Polly clip. Sentence audio is generated OFFLINE (scripts/gen-reading-audio.py,
// Joanna female voice) into public/audio/reading/<storyId>/<NN>.mp3; at runtime we only play the static
// file and gracefully fall back to the browser's English voice when a clip is missing.

export type ReadingLevel = "fable" | "tale";

export interface ReadingSentence {
  /** Stable per-story id (s01, s02 …) — keys highlight/progress, independent of array index. */
  id: string;
  en: string;
  zh: string;
  /** /audio/reading/<storyId>/<NN>.mp3 */
  audio: string;
}

export interface ReadingIllustration {
  /** /images/reading/<storyId>/<NN>.png */
  src: string;
  alt: string;
  /** First sentence this picture represents. Used to highlight the current story beat. */
  fromSentenceId: string;
}

export interface BilingualStory {
  id: string;
  titleEn: string;
  titleZh: string;
  emoji: string;
  level: ReadingLevel;
  sentences: ReadingSentence[];
  illustrations?: readonly ReadingIllustration[];
}
