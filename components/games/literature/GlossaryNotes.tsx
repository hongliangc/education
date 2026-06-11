// 关键字 / 词 / 典故的就近注释列表。寓言精读与名句卡共用，保证样式一致。
import type { GlossaryEntry } from "@/content/classics/types";

const KIND_BADGE: Record<GlossaryEntry["kind"], string> = {
  字: "bg-sky-100 text-sky-700",
  词: "bg-violet-100 text-violet-700",
  典故: "bg-amber-100 text-amber-700",
};

export function GlossaryNotes({ notes }: { notes: GlossaryEntry[] }) {
  if (notes.length === 0) return null;
  return (
    <ul className="mt-2 flex flex-col gap-1.5">
      {notes.map((n) => (
        <li
          key={n.term}
          className="flex items-start gap-2 text-left text-sm leading-relaxed text-slate-600"
        >
          <span
            className={`mt-0.5 shrink-0 rounded-full px-2 py-0.5 text-xs font-bold ${KIND_BADGE[n.kind]}`}
          >
            {n.kind}
          </span>
          <span>
            <b className="text-slate-800">{n.term}</b>：{n.explain}
          </span>
        </li>
      ))}
    </ul>
  );
}
