export function CardSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 w-full max-w-2xl">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="rounded-3xl bg-white/40 backdrop-blur p-5 anim-pulse-soft h-44"
        />
      ))}
    </div>
  );
}
