"use client";

import {
  HANZI_CATALOG,
  HANZI_LEVELS,
  categorizeHanzi,
  getHanziForLevel,
  getHanziStatus,
  type HanziItem,
  type HanziLearningStatus,
  type HanziProgressMap,
  type PrimaryGradeLevel,
} from "@/content/hanzi";

const LEVEL_LABELS: Record<PrimaryGradeLevel, string> = {
  G1: "一年级",
  G2: "二年级",
  G3: "三年级",
  G4: "四年级",
  G5: "五年级",
  G6: "六年级",
};

const STATUS_META: Record<HanziLearningStatus, { label: string; className: string; dot: string }> = {
  practice: { label: "还要练", className: "bg-amber-50 text-amber-700 ring-amber-100", dot: "bg-amber-400" },
  review: { label: "该复习", className: "bg-sky-50 text-sky-700 ring-sky-100", dot: "bg-sky-400" },
  known: { label: "已会", className: "bg-emerald-50 text-emerald-700 ring-emerald-100", dot: "bg-emerald-400" },
};

export function HanziLibraryProgress({ progress }: { progress: HanziProgressMap }) {
  const now = Date.now();
  const totalGroups = categorizeHanzi(HANZI_CATALOG, progress, now);
  const knownCount = totalGroups.known.length;
  const reviewCount = totalGroups.review.length;
  const totalCount = HANZI_CATALOG.length;
  const knownPct = Math.round((knownCount / Math.max(1, totalCount)) * 100);

  return (
    <section className="space-y-3">
      <div className="rounded-3xl bg-white p-4 shadow ring-1 ring-slate-100">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h4 className="text-lg font-bold text-slate-800">分组字库进度</h4>
            <p className="text-xs text-slate-500">
              按短语和系列记忆；已会的字会跳过练习，到期后进入复习。
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-black text-emerald-600">{knownPct}%</div>
            <div className="text-xs font-bold text-slate-400">
              已会 {knownCount} / {totalCount}
            </div>
          </div>
        </div>
        <div className="mt-3 h-3 overflow-hidden rounded-full bg-slate-100">
          <div className="h-full bg-emerald-400" style={{ width: `${knownPct}%` }} />
        </div>
        <div className="mt-3 flex flex-wrap gap-2 text-xs font-bold">
          <StatusPill status="practice" count={totalGroups.practice.length} />
          <StatusPill status="review" count={reviewCount} />
          <StatusPill status="known" count={knownCount} />
        </div>
      </div>

      <div className="space-y-3">
        {HANZI_LEVELS.map((level) => {
          const items = getHanziForLevel(level);
          const groups = groupLevelItems(items);
          const levelKnown = items.filter((item) => getHanziStatus(progress[item.id], now) === "known").length;
          return (
            <article key={level} className="rounded-3xl bg-white p-4 shadow ring-1 ring-slate-100">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="font-bold text-slate-800">{LEVEL_LABELS[level]}</div>
                <div className="text-xs font-bold text-slate-400">
                  已会 {levelKnown} / {items.length}
                </div>
              </div>

              <div className="mt-3 grid gap-3 md:grid-cols-2">
                {groups.map((group) => (
                  <GroupCard key={group.groupId} group={group} progress={progress} now={now} />
                ))}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function GroupCard({
  group,
  progress,
  now,
}: {
  group: HanziGroupView;
  progress: HanziProgressMap;
  now: number;
}) {
  const statusCounts = categorizeHanzi(group.items, progress, now);
  return (
    <div className="rounded-2xl bg-slate-50 p-3 ring-1 ring-slate-100">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="text-sm font-bold text-slate-800">{group.title}</div>
          <div className="mt-0.5 text-xs font-bold text-slate-500">{group.phrase}</div>
        </div>
        <div className="shrink-0 text-xs font-bold text-slate-400">{group.items.length} 字</div>
      </div>

      <div className="mt-2 flex flex-wrap gap-1.5">
        {group.items.map((item) => {
          const status = getHanziStatus(progress[item.id], now);
          return (
            <span
              key={item.id}
              className={`grid h-9 w-9 place-items-center rounded-xl text-lg font-bold shadow-sm ring-1 ${STATUS_META[status].className}`}
              title={`${item.char} ${item.pinyin} · ${STATUS_META[status].label}`}
            >
              {item.char}
            </span>
          );
        })}
      </div>

      <div className="mt-2 flex flex-wrap gap-2 text-[11px] font-bold">
        <StatusPill status="practice" count={statusCounts.practice.length} />
        <StatusPill status="review" count={statusCounts.review.length} />
        <StatusPill status="known" count={statusCounts.known.length} />
      </div>
    </div>
  );
}

function StatusPill({ status, count }: { status: HanziLearningStatus; count: number }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 ring-1 ${STATUS_META[status].className}`}>
      <span className={`h-2 w-2 rounded-full ${STATUS_META[status].dot}`} />
      {STATUS_META[status].label} {count}
    </span>
  );
}

interface HanziGroupView {
  groupId: string;
  title: string;
  phrase: string;
  items: HanziItem[];
}

function groupLevelItems(items: readonly HanziItem[]): HanziGroupView[] {
  const map = new Map<string, HanziGroupView>();
  for (const item of items) {
    const group = map.get(item.groupId);
    if (group) {
      group.items.push(item);
    } else {
      map.set(item.groupId, {
        groupId: item.groupId,
        title: item.groupTitle,
        phrase: item.groupPhrase,
        items: [item],
      });
    }
  }
  return [...map.values()];
}
