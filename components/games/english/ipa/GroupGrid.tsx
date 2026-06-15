import { IPA_GROUPS, phonemesInGroup, type PhonemeGroup } from "@/content/english/ipa";

const GROUP_META: Record<PhonemeGroup, { emoji: string; description: string }> = {
  长元音: { emoji: "🎵", description: "声音拉长一点" },
  短元音: { emoji: "✨", description: "短促又清楚" },
  双元音: { emoji: "🌈", description: "两个口型滑动" },
  爆破音: { emoji: "💥", description: "气流突然放出" },
  摩擦音: { emoji: "🌬️", description: "气流轻轻摩擦" },
  破擦音: { emoji: "🚂", description: "先挡住再放开" },
  鼻音: { emoji: "👃", description: "声音经过鼻腔" },
  半元音: { emoji: "🛝", description: "像元音一样滑动" },
};

export function GroupGrid({ onSelect }: { onSelect: (group: PhonemeGroup) => void }) {
  return (
    <div>
      <div className="text-center">
        <p className="text-sm font-bold text-sky-500">🗣️ 完整国际音标</p>
        <h2 className="mt-1 text-xl font-black text-slate-800">48 个发音小精灵</h2>
        <p className="mt-1 text-sm text-slate-500">先选一组，用例词听清每个音。</p>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3">
        {IPA_GROUPS.map((group) => {
          const phonemes = phonemesInGroup(group);
          const vowel = phonemes[0]?.kind === "vowel";
          const meta = GROUP_META[group];
          return (
            <button
              key={group}
              type="button"
              onClick={() => onSelect(group)}
              className={`rounded-3xl p-4 text-left shadow-sm ring-1 transition hover:-translate-y-0.5 hover:shadow active:scale-95 ${
                vowel
                  ? "bg-gradient-to-br from-rose-50 to-amber-50 ring-rose-200"
                  : "bg-gradient-to-br from-sky-50 to-indigo-50 ring-sky-200"
              }`}
            >
              <span className="text-3xl">{meta.emoji}</span>
              <span className={`mt-2 block text-lg font-black ${vowel ? "text-rose-600" : "text-sky-600"}`}>
                {group}
              </span>
              <span className="block text-xs text-slate-500">{meta.description}</span>
              <span className="mt-2 block text-xs font-bold text-slate-400">
                {phonemes.length} 个音
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
