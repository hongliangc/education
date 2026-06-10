import type {
  ArithmeticProblem,
  ComparisonProblem,
  FractionProblem,
  MathProblem,
  MeasurementProblem,
  ShapeProblem,
  TimeProblem,
  WordProblem,
} from "@/content/math";

const ITEMS = ["🍎", "⭐", "🌸", "🍬"];

function CountVisual({ problem, guideStep }: { problem: ArithmeticProblem; guideStep: number }) {
  const [left, right] = problem.operands;
  const answer = Number(problem.answer);
  const emoji = ITEMS[(left + right) % ITEMS.length]!;

  if (problem.op === "+") {
    return (
      <div className="flex flex-wrap items-center justify-center gap-3 text-3xl">
        <div className="rounded-2xl bg-white/70 p-3">{emoji.repeat(left)}</div>
        <span className="font-bold text-amber-600">+</span>
        <div className="rounded-2xl bg-white/70 p-3">{emoji.repeat(right)}</div>
        {guideStep > 0 ? (
          <div className="flex w-full justify-center gap-1 font-bold text-emerald-600 anim-pop-in">
            {Array.from({ length: answer }, (_, index) => (
              <span key={index} className={index < guideStep ? "scale-110 opacity-100" : "opacity-25"}>
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
        <div className="w-full text-base font-bold text-emerald-700">还剩 {problem.answer} 个</div>
      ) : null}
    </div>
  );
}

function ColumnVisual({ problem, guideStep }: { problem: ArithmeticProblem; guideStep: number }) {
  const [left, right] = problem.operands;
  const carry = problem.op === "+" && (left % 10) + (right % 10) >= 10;
  const borrow = problem.op === "-" && left % 10 < right % 10;

  return (
    <div className="mx-auto w-40 text-right font-mono text-3xl font-bold text-slate-700">
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
    </div>
  );
}

function ArrayVisual({ problem, guideStep }: { problem: ArithmeticProblem; guideStep: number }) {
  const [left, right] = problem.operands;

  if (problem.op === "×") {
    if (left <= 10 && right <= 10) {
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
    // Multi-digit: show repeated addition with the smaller factor as the group count.
    const groups = Math.min(left, right);
    const each = Math.max(left, right);
    return (
      <div className="flex flex-wrap items-center justify-center gap-2 text-lg font-bold text-sky-600">
        {Array.from({ length: groups }, (_, index) => (
          <span key={index} className="flex items-center gap-2">
            <span className="rounded-xl bg-sky-100 px-3 py-1">{each}</span>
            {index < groups - 1 ? <span className="text-slate-400">+</span> : null}
          </span>
        ))}
      </div>
    );
  }

  const answer = Number(problem.answer);
  const compact = right <= 6 && answer <= 12;
  return (
    <div className="flex flex-wrap justify-center gap-2">
      {Array.from({ length: right }, (_, group) => (
        <div
          key={group}
          className={`min-w-16 rounded-2xl border-2 border-dashed p-2 text-center text-sky-500 transition ${
            guideStep > 0 && group < guideStep ? "border-amber-400 bg-amber-100 scale-105" : "border-sky-300"
          }`}
        >
          {compact ? "●".repeat(answer) : <span className="font-bold">?</span>}
        </div>
      ))}
    </div>
  );
}

function ComparisonVisual({ problem, guideStep }: { problem: ComparisonProblem; guideStep: number }) {
  const max = Math.max(problem.left, problem.right, 1);
  const sign = problem.left > problem.right ? ">" : problem.left < problem.right ? "<" : "=";
  return (
    <div className="mx-auto w-56 space-y-3">
      {[problem.left, problem.right].map((value, index) => (
        <div key={index} className="flex items-center gap-2">
          <span className="w-10 text-right font-bold text-slate-700">{value}</span>
          <div className="h-5 flex-1 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-500"
              style={{ width: `${(value / max) * 100}%` }}
            />
          </div>
        </div>
      ))}
      {guideStep > 0 ? (
        <div className="text-center text-3xl font-bold text-emerald-600 anim-pop-in">{sign}</div>
      ) : null}
    </div>
  );
}

function ShapeVisual({ problem }: { problem: ShapeProblem }) {
  return <div className="text-center text-6xl anim-bob">{problem.shape}</div>;
}

function TimeVisual({ problem }: { problem: TimeProblem }) {
  const hourAngle = ((problem.hour % 12) + problem.minute / 60) * 30;
  const minuteAngle = problem.minute * 6;
  return (
    <div className="relative mx-auto h-28 w-28 rounded-full border-4 border-slate-300 bg-white">
      <div
        className="absolute left-1/2 top-1/2 h-9 w-1 origin-bottom -translate-x-1/2 -translate-y-full rounded-full bg-slate-700"
        style={{ transform: `translate(-50%, -100%) rotate(${hourAngle}deg)` }}
      />
      <div
        className="absolute left-1/2 top-1/2 h-12 w-0.5 origin-bottom -translate-x-1/2 -translate-y-full rounded-full bg-amber-500"
        style={{ transform: `translate(-50%, -100%) rotate(${minuteAngle}deg)` }}
      />
      <div className="absolute left-1/2 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-slate-800" />
    </div>
  );
}

function FractionVisual({ problem, guideStep }: { problem: FractionProblem; guideStep: number }) {
  return (
    <div className="mx-auto flex w-56 overflow-hidden rounded-xl ring-2 ring-slate-300">
      {Array.from({ length: problem.denominator }, (_, index) => (
        <div
          key={index}
          className={`h-12 flex-1 border-r border-white last:border-r-0 transition ${
            index < problem.numerator
              ? guideStep > 0
                ? "bg-pink-400 anim-pop-in"
                : "bg-pink-300"
              : "bg-slate-50"
          }`}
        />
      ))}
    </div>
  );
}

function MeasurementVisual({ problem }: { problem: MeasurementProblem }) {
  if (!problem.bars) {
    return (
      <div className="text-center">
        <div className="text-5xl">📏</div>
        <p className="mt-1 text-sm font-bold text-slate-500">1 米 = 100 厘米</p>
      </div>
    );
  }
  const max = Math.max(...problem.bars.map((bar) => bar.length), 1);
  return (
    <div className="mx-auto w-56 space-y-2">
      {problem.bars.map((bar) => (
        <div key={bar.label} className="flex items-center gap-2">
          <span className="w-10 text-right text-sm font-bold text-slate-600">{bar.label}</span>
          <div className="h-4 flex-1 rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-gradient-to-r from-sky-400 to-cyan-500"
              style={{ width: `${(bar.length / max) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function WordVisual({ problem }: { problem: WordProblem }) {
  const emoji = problem.op === "×" ? "🍪" : problem.op === "-" ? "📚" : "💰";
  return (
    <div className="flex items-center justify-center gap-3 text-2xl font-bold text-slate-600">
      <span className="text-4xl">{emoji}</span>
      <span className="rounded-xl bg-white/70 px-3 py-1">{problem.operands[0]}</span>
      <span className="text-amber-600">{problem.op}</span>
      <span className="rounded-xl bg-white/70 px-3 py-1">{problem.operands[1]}</span>
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
  switch (problem.kind) {
    case "arithmetic": {
      if (problem.op === "×" || problem.op === "÷") {
        return <ArrayVisual problem={problem} guideStep={guideStep} />;
      }
      const small = Math.max(problem.operands[0], problem.operands[1]) <= 10;
      return small ? (
        <CountVisual problem={problem} guideStep={guideStep} />
      ) : (
        <ColumnVisual problem={problem} guideStep={guideStep} />
      );
    }
    case "comparison":
      return <ComparisonVisual problem={problem} guideStep={guideStep} />;
    case "shape":
      return <ShapeVisual problem={problem} />;
    case "time":
      return <TimeVisual problem={problem} />;
    case "fraction":
      return <FractionVisual problem={problem} guideStep={guideStep} />;
    case "measurement":
      return <MeasurementVisual problem={problem} />;
    case "word":
      return <WordVisual problem={problem} />;
  }
}
