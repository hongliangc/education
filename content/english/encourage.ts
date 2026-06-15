// The "encourage-first, never block" rule for the speaking steps (design §4). Pure, self-contained
// leaf (no runtime imports) so the Node test runner loads it directly. Given whether an attempt was
// accepted and which attempt it is, decide the outcome: celebrate, gently retry once, or soft-pass
// so a 3–10-year-old is never trapped on pronunciation.

export type AttemptOutcome = "correct" | "retry" | "softpass";

export function gradeAttempt(
  ok: boolean,
  attemptNumber: number,
  maxAttempts = 2,
): AttemptOutcome {
  if (ok) return "correct";
  return attemptNumber >= maxAttempts ? "softpass" : "retry";
}
