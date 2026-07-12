import type { Grade } from "../../lib/grades.ts";

export type HanziLearnerBand = "early" | "starter" | "growing";
export type HanziInputModality = "visual" | "audio" | "touch" | "text";
export type HanziExplanationEvidence = "teach-sprite" | "point" | "sort" | "say" | "example";

export interface HanziDomainAdapter {
  learnerBand: HanziLearnerBand;
  maxMinutes: number;
  maxNewItems: number;
  inputModalities: readonly HanziInputModality[];
  explanationEvidence: readonly HanziExplanationEvidence[];
}

export function getHanziDomainAdapter(grade: Grade): HanziDomainAdapter {
  if (grade === "K1" || grade === "K2" || grade === "K3") {
    return {
      learnerBand: "early",
      maxMinutes: 5,
      maxNewItems: 1,
      inputModalities: ["visual", "audio", "touch"],
      explanationEvidence: ["teach-sprite", "point", "sort"],
    };
  }
  if (grade === "G1" || grade === "G2") {
    return {
      learnerBand: "starter",
      maxMinutes: 8,
      maxNewItems: 3,
      inputModalities: ["visual", "audio", "touch", "text"],
      explanationEvidence: ["teach-sprite", "point", "sort", "say"],
    };
  }
  return {
    learnerBand: "growing",
    maxMinutes: 10,
    maxNewItems: 4,
    inputModalities: ["visual", "audio", "touch", "text"],
    explanationEvidence: ["teach-sprite", "sort", "say", "example"],
  };
}
