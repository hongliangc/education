export type HanziCapability = "recognition" | "pronunciation" | "meaning" | "usage" | "writing" | "transfer";
export type HanziMasteryStage = "unknown" | "understanding" | "fluent" | "mastered" | "transferred";
export type HanziGate = "UNDERSTAND" | "FLUENT" | "MASTER" | "APPLY" | "REVIEW";
export type HanziEvidenceError = "PREREQUISITE" | "CONCEPT" | "PROCEDURE" | "MEMORY" | "TRANSFER" | "CARELESS";
export type HanziDecision = "PASS" | "RETRY" | "BACKTRACK" | "DEFER";
export type HanziReviewAction = "NONE" | "LENGTHEN" | "KEEP" | "SHORTEN" | "REOPEN";

export interface HanziCapabilityState {
  stage: HanziMasteryStage;
  lastScore: number;
  lastAssessedAt: number;
  hints: number;
  errorType?: HanziEvidenceError;
}

export interface HanziMasteryEntry {
  capabilities: Partial<Record<HanziCapability, HanziCapabilityState>>;
}

export type HanziMasteryMap = Record<string, HanziMasteryEntry>;

export interface HanziEvidenceInput {
  capability: HanziCapability;
  gate: HanziGate;
  score: number;
  independent: boolean;
  assessedAt: number;
  hints?: number;
  setScores?: readonly number[];
  explanationPassed?: boolean;
  delayedPassed?: boolean;
  novelTaskPassed?: boolean;
  methodScore?: number;
  explanationScore?: number;
  errorType?: HanziEvidenceError;
  remediationCycles?: number;
}

export interface HanziNextAction {
  decision: HanziDecision;
  reviewAction: HanziReviewAction;
}

export function recordHanziEvidence(
  progress: HanziMasteryMap,
  hanziId: string,
  input: HanziEvidenceInput,
): HanziMasteryMap {
  const nextAction = decideHanziNextAction(input);
  const previous = progress[hanziId] ?? { capabilities: {} };
  const stage = nextAction.decision === "PASS" ? passedStage(input.gate) : retainedStage(previous.capabilities[input.capability]?.stage);
  return {
    ...progress,
    [hanziId]: {
      capabilities: {
        ...previous.capabilities,
        [input.capability]: {
          stage,
          lastScore: input.score,
          lastAssessedAt: input.assessedAt,
          hints: input.hints ?? 0,
          ...(input.errorType ? { errorType: input.errorType } : {}),
        },
      },
    },
  };
}

export function decideHanziNextAction(input: Omit<HanziEvidenceInput, "capability" | "assessedAt">): HanziNextAction {
  if (input.errorType === "PREREQUISITE") return { decision: "BACKTRACK", reviewAction: "NONE" };
  if (input.gate === "REVIEW") return decideReview(input);

  let passed = false;
  if (input.gate === "UNDERSTAND") {
    passed = input.score >= 80 && input.independent && input.explanationPassed === true;
  } else if (input.gate === "FLUENT") {
    passed = Boolean(input.setScores && input.setScores.length >= 2 && input.setScores.every((score) => score >= 85) && input.independent && (input.hints ?? 0) <= 1);
  } else if (input.gate === "MASTER") {
    const immediatePassed = input.score >= 90 && input.independent && (input.hints ?? 0) === 0;
    if (immediatePassed && input.delayedPassed !== true) return { decision: "DEFER", reviewAction: "NONE" };
    passed = immediatePassed && input.delayedPassed === true && input.errorType !== "CONCEPT";
  } else if (input.gate === "APPLY") {
    passed = input.score >= 80 && input.independent && input.novelTaskPassed === true && (input.methodScore ?? 0) > 0 && (input.explanationScore ?? 0) > 0;
  }

  if (passed) return { decision: "PASS", reviewAction: "NONE" };
  if ((input.remediationCycles ?? 0) >= 2) return { decision: "DEFER", reviewAction: "NONE" };
  return { decision: "RETRY", reviewAction: "NONE" };
}

function decideReview(input: Omit<HanziEvidenceInput, "capability" | "assessedAt">): HanziNextAction {
  if (input.errorType === "CONCEPT") return { decision: "RETRY", reviewAction: "REOPEN" };
  if (input.score >= 90 && input.independent) return { decision: "PASS", reviewAction: "LENGTHEN" };
  if (input.score >= 80 && input.independent) return { decision: "PASS", reviewAction: "KEEP" };
  return { decision: "RETRY", reviewAction: "SHORTEN" };
}

function passedStage(gate: HanziGate): HanziMasteryStage {
  if (gate === "UNDERSTAND") return "understanding";
  if (gate === "FLUENT") return "fluent";
  if (gate === "MASTER" || gate === "REVIEW") return "mastered";
  return "transferred";
}

function retainedStage(stage: HanziMasteryStage | undefined): HanziMasteryStage {
  return stage ?? "unknown";
}
