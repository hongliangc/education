import type { AlphabetEntry } from "@/content/english/alphabet";

export function LetterGrid({
  entries,
  onSelect,
}: {
  entries: readonly AlphabetEntry[];
  onSelect: (index: number) => void;
}) {
  return (
    <div>
      <div className="text-center">
        <p className="text-sm font-bold text-amber-500">🔤 26 个英文字母</p>
        <h2 className="mt-1 text-xl font-black text-slate-800">选一个字母开始冒险</h2>
        <p className="mt-1 text-sm text-slate-500">点字母，听发音，再大声读出例词。</p>
      </div>

      <div className="mt-5 grid grid-cols-4 gap-2 sm:grid-cols-5">
        {entries.map((entry, index) => (
          <button
            key={entry.letter}
            type="button"
            onClick={() => onSelect(index)}
            className="anim-pop-in rounded-2xl bg-gradient-to-br from-amber-50 to-orange-100 px-2 py-3 text-center shadow-sm ring-1 ring-amber-200 transition hover:-translate-y-0.5 hover:shadow active:scale-95"
            aria-label={`学习字母 ${entry.letter}`}
          >
            <span className="block text-2xl font-black text-orange-600">
              {entry.letter}
              <span className="text-lg text-amber-500">{entry.lower}</span>
            </span>
            <span className="mt-1 block text-2xl">{entry.emoji}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
