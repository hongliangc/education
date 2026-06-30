declare module "hanzi-writer" {
  export interface HanziWriterOptions {
    width?: number;
    height?: number;
    padding?: number;
    showOutline?: boolean;
    showCharacter?: boolean;
    strokeAnimationSpeed?: number;
    delayBetweenStrokes?: number;
    strokeColor?: string;
    outlineColor?: string;
    highlightColor?: string;
    drawingColor?: string;
    drawingWidth?: number;
    charDataLoader?: (char: string) => Promise<unknown> | unknown;
    onLoadCharDataError?: (reason: unknown) => void;
  }

  export interface HanziQuizOptions {
    onComplete?: () => void;
    onCorrectStroke?: () => void;
    onMistake?: () => void;
  }

  export interface HanziWriterInstance {
    animateCharacter: () => Promise<unknown>;
    showOutline: (options?: { duration?: number }) => Promise<unknown>;
    hideOutline: (options?: { duration?: number }) => Promise<unknown>;
    hideCharacter: (options?: { duration?: number }) => Promise<unknown>;
    quiz: (options?: HanziQuizOptions) => void;
    cancelQuiz: () => void;
    setCharacter: (char: string) => Promise<unknown>;
  }

  export interface HanziWriterStatic {
    create: (
      element: string | HTMLElement,
      character: string,
      options?: HanziWriterOptions,
    ) => HanziWriterInstance;
  }

  const HanziWriter: HanziWriterStatic;
  export default HanziWriter;
}
