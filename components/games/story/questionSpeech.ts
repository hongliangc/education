import type { StoryQuestion } from "@/content/storybooks/types";

export function questionSpeechText(question: StoryQuestion): string {
  const choices = question.choices
    .map((choice, index) => `选项 ${String.fromCharCode(65 + index)}，${choice}。`)
    .join("");

  return `${question.q}${choices}`;
}
