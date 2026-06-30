export interface PracticeWriter {
  cancelQuiz: () => void;
  animateCharacter: () => Promise<unknown>;
  hideCharacter: (options?: { duration?: number }) => Promise<unknown>;
}

export async function runDemoThenPractice(writer: PracticeWriter): Promise<void> {
  writer.cancelQuiz();
  await writer.animateCharacter();
  await writer.hideCharacter({ duration: 80 });
}
