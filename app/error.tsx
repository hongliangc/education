"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Btn } from "@/components/Btn";
import { FairySprite } from "@/components/fairy/FairySprite";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();
  useEffect(() => {
    console.error("[GlobalError]", error);
  }, [error]);

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-5 py-10 bg-gradient-to-b from-rose-100 to-pink-100">
      <FairySprite mood="surprised" size={140} />
      <h1 className="text-3xl font-bold text-rose-700 mt-4">出了点小问题</h1>
      <p className="text-slate-600 mt-2 max-w-md text-center">
        精灵需要喘口气，让我们重新试一次吧！
      </p>
      {error.digest && (
        <p className="text-xs text-slate-400 mt-2">错误编号：{error.digest}</p>
      )}
      <div className="flex gap-3 mt-6">
        <Btn variant="ghost" onClick={() => router.push("/")}>
          回首页
        </Btn>
        <Btn variant="primary" onClick={() => reset()}>
          再试一次 🔁
        </Btn>
      </div>
    </main>
  );
}
