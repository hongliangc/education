export default function ManagementLoading() {
  return (
    <div aria-label="正在加载管理页面" role="status" className="animate-pulse space-y-8">
      <div className="space-y-3">
        <div className="h-4 w-24 rounded bg-slate-200" />
        <div className="h-8 w-48 rounded-lg bg-slate-200" />
        <div className="h-4 max-w-md rounded bg-slate-100" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <div key={index} className="h-28 rounded-2xl border border-slate-200 bg-slate-50" />
        ))}
      </div>
      <div className="space-y-3 rounded-2xl border border-slate-200 p-4">
        <div className="h-12 rounded-xl bg-slate-100" />
        <div className="h-12 rounded-xl bg-slate-100" />
      </div>
      <span className="sr-only">正在加载</span>
    </div>
  );
}
