export function GameModalSkeleton() {
  return (
    <div className="fixed inset-0 z-40 bg-black/40 flex items-center justify-center p-3 sm:p-6">
      <div className="w-full max-w-3xl max-h-[92vh] bg-white rounded-[2rem] shadow-2xl overflow-hidden flex flex-col">
        <header className="px-5 py-4 bg-gradient-to-r from-slate-200 to-slate-300 anim-pulse-soft h-16" />
        <div className="flex-1 p-7 space-y-4">
          <div className="h-4 w-1/3 bg-slate-200 rounded anim-pulse-soft" />
          <div className="h-32 bg-slate-100 rounded-2xl anim-pulse-soft" />
          <div className="grid grid-cols-2 gap-3">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="h-12 bg-slate-100 rounded-2xl anim-pulse-soft" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
