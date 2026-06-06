export interface NarrationController {
  pause(): void;
  resume(): void;
  stop(): void;
}

export const QUESTION_REPLAY_LABEL = "重新播报当前问题和选项";

type Narrate = (
  text: string,
  options: { lang: string; rate: number },
) => NarrationController;

export function startQuestionNarration(
  narrate: Narrate,
  text: string,
): NarrationController {
  return narrate(text, {
    lang: "zh-CN",
    rate: 0.9,
  });
}
