"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Btn } from "@/components/Btn";
import { KingdomBG } from "@/components/KingdomBG";

export default function RegisterPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [shake, setShake] = useState(false);
  const [pending, start] = useTransition();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!identifier.trim()) return fail("请填写手机号或邮箱");
    if (password.length < 6) return fail("密码至少 6 位");
    if (password !== password2) return fail("两次密码不一致");

    start(async () => {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ identifier: identifier.trim(), password }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        return fail(j.error ?? "注册失败");
      }
      // 注册成功后自动登录
      await signIn("credentials", {
        identifier: identifier.trim(),
        password,
        redirect: false,
      });
      router.replace("/child-select");
      router.refresh();
    });
  };

  function fail(msg: string) {
    setError(msg);
    setShake(true);
    setTimeout(() => setShake(false), 350);
  }

  return (
    <>
      <KingdomBG priority />
      <main className="relative z-10 flex min-h-screen items-center justify-center px-5 py-6 sm:py-10">
        <div className={`w-full max-w-sm ${shake ? "anim-shake" : ""} anim-slide-up`}>
          <div className="mb-4 text-center sm:mb-6">
            <Image
              src="/ui/mascot/fairy-guide.webp"
              alt="向导精灵小星"
              width={128}
              height={174}
              priority
              className="anim-float mx-auto h-24 w-auto object-contain sm:h-28"
            />
            <h1 className="mt-1 text-3xl font-bold text-white drop-shadow-lg sm:text-4xl">
              创建家长账号
            </h1>
            <p className="mt-1 text-white/90">创建账号，保存小冒险家的成长 ✨</p>
          </div>

          <form
            onSubmit={submit}
            className="rounded-[2rem] bg-white/88 p-6 shadow-2xl ring-2 ring-white/70 backdrop-blur"
          >
            <label className="block mb-3">
              <span className="text-sm font-bold text-slate-600">手机号或邮箱</span>
              <input
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className="mt-1 w-full rounded-2xl border-2 border-pink-200 bg-white px-4 py-3 outline-none focus:border-pink-400"
                autoComplete="username"
              />
            </label>
            <label className="block mb-3">
              <span className="text-sm font-bold text-slate-600">密码</span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 w-full rounded-2xl border-2 border-pink-200 bg-white px-4 py-3 outline-none focus:border-pink-400"
                autoComplete="new-password"
              />
            </label>
            <label className="block mb-2">
              <span className="text-sm font-bold text-slate-600">再输一次密码</span>
              <input
                type="password"
                value={password2}
                onChange={(e) => setPassword2(e.target.value)}
                className="mt-1 w-full rounded-2xl border-2 border-pink-200 bg-white px-4 py-3 outline-none focus:border-pink-400"
                autoComplete="new-password"
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
              {pending ? "注册中…" : "创建账号 ✨"}
            </Btn>

            <div className="text-sm mt-4 text-slate-500">
              <Link href="/login" className="underline decoration-sky-400">
                已有账号？去登录
              </Link>
            </div>
          </form>
        </div>
      </main>
    </>
  );
}
