import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-5 py-10">
      <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <p className="text-sm font-bold tracking-[0.3em] text-blue-600">404</p>
        <h1 className="mt-3 text-3xl font-bold text-slate-950">页面不存在</h1>
        <p className="mt-3 text-slate-600">这个入口可能已经移动，回到首页重新出发吧。</p>
        <Link href="/" className="mt-7 inline-flex min-h-11 items-center rounded-xl bg-blue-600 px-6 font-semibold text-white hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600">返回首页</Link>
      </div>
    </main>
  );
}
