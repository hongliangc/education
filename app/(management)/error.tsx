"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function ManagementError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error("[ManagementError]", error);
  }, [error]);

  return (
    <div role="alert" className="mx-auto max-w-xl rounded-2xl border border-rose-200 bg-white p-6 text-center shadow-sm sm:p-8">
      <span aria-hidden="true" className="text-3xl">!</span>
      <h1 className="mt-3 text-2xl font-bold text-slate-950">页面暂时无法加载</h1>
      <p className="mt-2 text-sm text-slate-600">数据没有发生变化，请稍后重试或返回首页。</p>
      {error.digest ? <p className="mt-2 text-xs text-slate-400">错误编号：{error.digest}</p> : null}
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Link href="/" className="inline-flex min-h-11 items-center rounded-xl border border-slate-300 px-5 font-medium text-slate-700 hover:bg-slate-50">返回首页</Link>
        <button type="button" onClick={() => unstable_retry()} className="min-h-11 rounded-xl bg-blue-600 px-5 font-semibold text-white hover:bg-blue-700">再试一次</button>
      </div>
    </div>
  );
}
