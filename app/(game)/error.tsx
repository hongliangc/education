"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Btn } from "@/components/Btn";
import { FairyBubble } from "@/components/fairy/FairyBubble";

export default function GameError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  const router = useRouter();
  useEffect(() => {
    console.error("[GameError]", error);
  }, [error]);

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-5 py-10">
      <FairyBubble
        mood="thinking"
        text={"小精灵开了个小差…\n要不我们重新出发？"}
        side="left"
      />
      {error.digest && (
        <p className="text-xs text-white/70 mt-3">错误编号：{error.digest}</p>
      )}
      <div className="flex gap-3 mt-6">
        <Btn variant="ghost" onClick={() => router.push("/world")}>
          回地图
        </Btn>
        <Btn variant="primary" onClick={() => unstable_retry()}>
          再试一次 ✨
        </Btn>
      </div>
    </main>
  );
}
