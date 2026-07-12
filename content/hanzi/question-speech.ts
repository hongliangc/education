import type { HanziChallenge } from "./round-core";

export function hanziQuestionSpeechText(question: HanziChallenge): string {
  const choices = question.choices
    .map((choice, index) => `选项 ${String.fromCharCode(65 + index)}，${choice.char}。`)
    .join("");
  const prompt = question.mode === "pinyin-char"
    ? `请听，${question.choices.find((choice) => choice.id === question.answerId)?.char ?? ""}。找出这个读音对应的字`
    : question.prompt;
  return `${prompt}。${choices}`;
}
