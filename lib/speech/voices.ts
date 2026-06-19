// 腾讯云大模型音色目录（扣「大模型语音合成」预付费包）。
// 同时作为服务端白名单（synthesize 只接受这里列出的音色）与客户端选择器数据源。
// 完整列表见 https://cloud.tencent.com/document/product/1073/92668

export interface VoiceOption {
  id: number;
  name: string;
  desc: string;
  gender: "female" | "male";
  lang: "zh" | "en";
}

export const TTS_VOICES: VoiceOption[] = [
  { id: 601009, name: "爱小芊", desc: "童趣女声 · 活泼", gender: "female", lang: "zh" },
  { id: 601010, name: "爱小娇", desc: "温柔姐姐 · 亲和", gender: "female", lang: "zh" },
  { id: 601013, name: "爱小伊", desc: "讲故事女声 · 沉稳", gender: "female", lang: "zh" },
  { id: 601008, name: "爱小豪", desc: "阳光哥哥 · 男声", gender: "male", lang: "zh" },
  { id: 501009, name: "WeWinny", desc: "英文女声 · English", gender: "female", lang: "en" },
];

export const DEFAULT_VOICE_ZH = 601009;
export const DEFAULT_VOICE_EN = 501009;

export function isValidVoice(id: number): boolean {
  return TTS_VOICES.some((v) => v.id === id);
}

/**
 * 音色语言是否匹配朗读语言。用于避免「中文音色念英文」这类串用：
 * 朗读 en-* 必须用 en 音色，朗读 zh-* 必须用 zh 音色，否则发音错乱。
 * 未知音色返回 false（调用方应回落到该语言默认音色）。
 */
export function voiceMatchesLang(id: number, lang: string): boolean {
  const v = TTS_VOICES.find((x) => x.id === id);
  if (!v) return false;
  return lang.startsWith("zh") ? v.lang === "zh" : v.lang === "en";
}
