import { PINYIN_CHART, type PinyinChartItem } from "./pinyin-chart";
import { pinyinToneExamples, type PinyinToneExample } from "./pinyin-tone-examples";
import type { PinyinTone } from "./pinyin-speech";

export interface PinyinAudioItem {
  id: string;
  kind: "base" | "tone";
  path: string;
  phoneme: string;
  fallback: string;
}

export function pinyinAudioPath(item: PinyinChartItem): string {
  return `/audio/pinyin/${audioSlug(item.id)}/base.mp3`;
}

export function pinyinToneAudioPath(item: PinyinChartItem, tone: PinyinTone): string {
  return `/audio/pinyin/${audioSlug(item.id)}/tone-${tone}.mp3`;
}

export const PINYIN_AUDIO_ITEMS: readonly PinyinAudioItem[] = PINYIN_CHART.flatMap((item) => [
  {
    id: `${item.id}-base`,
    kind: "base" as const,
    path: pinyinAudioPath(item),
    phoneme: item.phoneme,
    fallback: item.fallback,
  },
  ...pinyinToneExamples(item).map((example) => ({
    id: `${item.id}-tone-${example.tone}`,
    kind: "tone" as const,
    path: pinyinToneAudioPath(item, example.tone),
    phoneme: example.phoneme,
    fallback: example.character,
  })),
]);

function audioSlug(id: string): string {
  return id.replaceAll("ü", "v");
}


export { pinyinToneExamples, type PinyinToneExample };
