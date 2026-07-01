// 演义 vs 史实 对照小卡 —「三国群英·锦卷」视觉令牌（绢面 #F3ECDA / 鎏金 #C9A24B /
// 魏蓝 #2C4A7E / 吴赤 #C2402F / 墨 #2B2622）。轻量可信度设计：提示演义含作家想象。
"use client";

export function HistoryNoteCard({
  note,
}: {
  note: { romance: string; history: string };
}) {
  return (
    <div className="rounded-3xl bg-[#F3ECDA] p-5 shadow-xl ring-1 ring-[#C9A24B]/40">
      <div className="mb-3 font-history text-lg text-[#2B2622]">📜 故事 vs 史实</div>
      <div className="space-y-3 text-sm leading-relaxed text-[#2B2622]">
        <p>
          <span className="mr-1 font-bold text-[#C2402F]">📖 演义这样写：</span>
          {note.romance}
        </p>
        <p>
          <span className="mr-1 font-bold text-[#2C4A7E]">📜 史书可能这样：</span>
          {note.history}
        </p>
      </div>
      <p className="mt-4 rounded-2xl bg-[#C9A24B]/15 px-3 py-2 text-xs text-[#2B2622]/70">
        小提示：《三国演义》是好看的故事，有些情节是作家想象出来的，不全是真发生过的事哦。
      </p>
    </div>
  );
}
