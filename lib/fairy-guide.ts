export const FAIRY_GUIDE_EVENT = "mlk:fairy-guide";
export const FAIRY_CHAT_STATE_EVENT = "mlk:fairy-chat-state";
export const FAIRY_OVERLAY_STATE_EVENT = "mlk:fairy-overlay-state";

export type FairyGuideEvent = "enter" | "hint" | "correct" | "incorrect" | "complete";

export type FairyGuideDetail = {
  event: FairyGuideEvent;
  text: string;
  autoHideMs?: number;
};

export function showFairyGuide(detail: FairyGuideDetail) {
  window.setTimeout(() => {
    window.dispatchEvent(new CustomEvent<FairyGuideDetail>(FAIRY_GUIDE_EVENT, { detail }));
  });
}
