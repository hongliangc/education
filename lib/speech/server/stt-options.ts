const DEFAULT_ZH_HOTWORDS = "小精灵|11,魔法学习王国|10,星星|5";

export interface RecognitionOptions {
  EngSerViceType: string;
  VoiceFormat: string;
  HotwordList?: string;
}

export function buildRecognitionOptions(
  opts: {
    lang?: string;
    format?: string;
    zhEngine?: string;
    zhHotwords?: string;
  } = {},
): RecognitionOptions {
  const isZh = (opts.lang ?? "zh-CN").startsWith("zh");
  const options: RecognitionOptions = {
    EngSerViceType: isZh ? (opts.zhEngine ?? "16k_zh") : "16k_en",
    VoiceFormat: opts.format ?? "mp3",
  };
  const hotwords = opts.zhHotwords ?? DEFAULT_ZH_HOTWORDS;

  if (isZh && hotwords) options.HotwordList = hotwords;
  return options;
}
