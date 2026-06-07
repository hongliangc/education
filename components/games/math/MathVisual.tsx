import type { MathProblem } from "@/content/math";

const ITEMS = ["🍎", "⭐", "🌸", "🍬"];

function BasicVisual({ problem, guideStep }: { problem: MathProblem; guideStep: number }) {
  const [left, right] = problem.operands;
  const emoji = ITEMS[(left + right) % ITEMS.length];

  if (problem.op === "+") {
    return (
      <div className="flex flex-wrap items-center justify-center gap-3 text-3xl">
        <div className="rounded-2xl bg-white/70 p-3">{emoji.repeat(left)}</div>
        <span className="font-bold text-amber-600">+</span>
        <div className="rounded-2xl bg-white/70 p-3">{emoji.repeat(right)}</div>
        {guideStep > 0 ? (
          <div className="flex w-full justify-center gap-1 font-bold text-emerald-600 anim-pop-in">
            {Array.from({ length: problem.answer }, (_, index) => (
              <span
                key={index}
                className={index < guideStep ? "scale-110 opacity-100" : "opacity-25"}
              >
                {emoji}
              </span>
            ))}
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div className="flex flex-wrap justify-center gap-2 text-3xl">
      {Array.from({ length: left }, (_, index) => {
        const removedIndex = index - (left - right);
        const removed = removedIndex >= 0 && removedIndex < guideStep;
        return (
          <span
            key={index}
            className={
              removed && guideStep >= 1
                ? "rounded-lg bg-rose-100 px-1 opacity-40 line-through decoration-rose-500 decoration-4"
                : "px-1"
            }
          >
            {emoji}
          </span>
        );
      })}
      {guideStep > 0 && guideStep >= right ? (
        <div className="w-full text-base font-bold text-emerald-700">
          还剩 {problem.answer} 个
        </div>
      ) : null}
    </div>
  );
}

function MidVisual({ problem, guideStep }: { problem: MathProblem; guideStep: number }) {
  const [left, right] = problem.operands;
  const carry = problem.op === "+" && left % 10 + (right % 10) >= 10;
  const borrow = problem.op === "-" && left % 10 < right % 10;

  return (
    <div className="mx-auto w-36 text-right font-mono text-3xl font-bold text-slate-700">
      <div className="mb-1 flex h-6 justify-end text-sm text-rose-500">
        {guideStep >= 2 && carry ? "进 1 ↑" : guideStep >= 2 && borrow ? "借 1 ↓" : ""}
      </div>
      <div className={guideStep === 1 ? "rounded bg-amber-200" : ""}>{left}</div>
      <div className={guideStep === 1 ? "rounded bg-amber-200" : ""}>
        <span className="float-left text-sky-600">{problem.op}</span>
        {right}
      </div>
      <div className="mt-1 border-t-4 border-slate-600 pt-1">
        {guideStep >= 3 ? problem.answer : "?"}
      </div>
      <div className="mt-2 grid grid-cols-2 text-xs font-sans font-medium text-slate-500">
        <span>十位</span>
        <span>个位</span>
      </div>
    </div>
  );
}

function AdvancedVisual({ problem, guideStep }: { problem: MathProblem; guideStep: number }) {
  const [left, right] = problem.operands;

  if (problem.op === "×") {
    return (
      <div className="space-y-1">
        {Array.from({ length: left }, (_, row) => (
          <div
            key={row}
            className={`flex justify-center gap-1 text-xl transition ${
              guideStep > 0 && row < guideStep ? "scale-110 text-amber-500" : "text-sky-500"
            }`}
          >
            {Array.from({ length: right }, (_, column) => (
              <span key={column}>●</span>
            ))}
          </div>
        ))}
      </div>
    );
  }

  const groups = Array.from({ length: right }, () => problem.answer);
  return (
    <div className="flex flex-wrap justify-center gap-2">
      {groups.map((count, group) => (
        <div
          key={group}
          className={`min-w-16 rounded-2xl border-2 border-dashed p-2 text-sky-500 transition ${
            guideStep > 0 && group < guideStep ? "border-amber-400 bg-amber-100 scale-105" : "border-sky-300"
          }`}
        >
          {"●".repeat(count)}
        </div>
      ))}
    </div>
  );
}

export function MathVisual({
  problem,
  guideStep = 0,
}: {
  problem: MathProblem;
  guideStep?: number;
}) {
  if (problem.tier === "BASIC") {
    return <BasicVisual problem={problem} guideStep={guideStep} />;
  }
  if (problem.tier === "MID") {
    return <MidVisual problem={problem} guideStep={guideStep} />;
  }
  return <AdvancedVisual problem={problem} guideStep={guideStep} />;
}
