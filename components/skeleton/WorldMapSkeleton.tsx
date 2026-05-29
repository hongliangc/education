export function WorldMapSkeleton() {
  return (
    <main className="min-h-screen pt-20 px-4 pb-10">
      <div className="max-w-5xl mx-auto">
        <div className="h-24 rounded-3xl bg-white/40 anim-pulse-soft mb-6" />
        <div className="rounded-[2.5rem] bg-white/30 backdrop-blur ring-1 ring-white/40 shadow-xl p-8">
          <svg viewBox="0 0 1000 600" className="w-full h-auto block">
            {[150, 340, 520, 720, 880].map((x, i) => (
              <g key={i} transform={`translate(${x} ${300 + (i % 2) * 160})`}>
                <circle r="56" fill="white" opacity="0.4" className="anim-pulse-soft" />
              </g>
            ))}
          </svg>
        </div>
        <div className="mt-5 rounded-3xl bg-white/40 anim-pulse-soft h-16" />
      </div>
    </main>
  );
}
