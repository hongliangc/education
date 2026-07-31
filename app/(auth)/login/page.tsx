"use client";

import { Suspense, useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { Btn } from "@/components/Btn";
import { KingdomBG } from "@/components/KingdomBG";

function LoginForm() {
  const router = useRouter();
  const search = useSearchParams();
  const next = search.get("next") ?? "/child-select";
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [shake, setShake] = useState(false);
  const [pending, start] = useTransition();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!identifier.trim() || password.length < 6) {
      setError("请填写账号和至少 6 位密码");
      setShake(true);
      setTimeout(() => setShake(false), 350);
      return;
    }
    start(async () => {
      const res = await signIn("credentials", {
        identifier: identifier.trim(),
        password,
        redirect: false,
      });
      if (res?.error) {
        setError("账号或密码错误");
        setShake(true);
        setTimeout(() => setShake(false), 350);
        return;
      }
      router.replace(next);
      router.refresh();
    });
  };

  return (
    <>
      <KingdomBG priority />
      <main className="relative z-10 flex min-h-screen items-center justify-start px-5 pt-10 sm:justify-center sm:py-10">
        <div className={`w-full max-w-sm ${shake ? "anim-shake" : ""} anim-slide-up`}>
          <div className="mb-3 text-center sm:mb-4">
            <Image
              src="/ui/brand/kingdom-logo-v1.png"
              alt="魔法学习王国"
              width={360}
              height={150}
              preload
              className="mx-auto h-auto w-64 max-w-full object-contain drop-shadow-xl sm:w-[18rem]"
            />
            <Image
              src="/ui/mascot/fairy-guide.webp"
              alt="向导精灵小星"
              width={128}
              height={174}
              loading="eager"
              className="anim-float mx-auto -mt-3 h-40 w-auto object-contain sm:h-40"
            />
            <h1 className="sr-only">魔法学习王国</h1>
          </div>

          <form
            onSubmit={submit}
            className="storybook-paper rounded-3xl p-5 backdrop-blur sm:p-6"
          >
            <h2 className="text-xl font-bold text-slate-700 mb-4">家长登录</h2>

            <label className="block mb-3">
              <span className="text-sm text-slate-600">手机号或邮箱</span>
              <input
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="13800138000 或 you@example.com"
                className="mt-1 w-full rounded-xl border-2 border-pink-200 bg-white px-4 py-3 outline-none focus:border-pink-400"
                autoComplete="username"
              />
            </label>
            <label className="block mb-2">
              <span className="text-sm text-slate-600">密码</span>
              <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type="password"
                placeholder="至少 6 位"
                className="mt-1 w-full rounded-xl border-2 border-pink-200 bg-white px-4 py-3 outline-none focus:border-pink-400"
                autoComplete="current-password"
              />
            </label>

            {error && (
              <p className="text-sm text-rose-500 mt-1 mb-2">⚠ {error}</p>
            )}

            <Btn
              type="submit"
              size="lg"
              variant="primary"
              disabled={pending}
              className="w-full mt-3"
            >
              {pending ? "登录中…" : "开始冒险 🚀"}
            </Btn>

            <div className="mt-4 text-center text-sm text-slate-500">
              <Link href="/register" className="underline decoration-pink-400">
                还没账号？去注册
              </Link>
            </div>
          </form>
        </div>
      </main>
    </>
  );
}

// useSearchParams 需要 Suspense 边界，否则 next build 预渲染 /login 会失败
export default function LoginPage() {
  return (
    <Suspense fallback={<KingdomBG priority />}>
      <LoginForm />
    </Suspense>
  );
}
