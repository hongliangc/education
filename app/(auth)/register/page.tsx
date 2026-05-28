"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Btn } from "@/components/Btn";
import { CloudBG } from "@/components/CloudBG";

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
      <CloudBG />
      <main className="min-h-screen flex items-center justify-center px-5 py-10">
        <div className={`w-full max-w-sm ${shake ? "anim-shake" : ""} anim-slide-up`}>
          <div className="text-center mb-5">
            <div className="text-6xl anim-float inline-block">🌟</div>
            <h1 className="text-3xl font-bold text-white drop-shadow-lg mt-2">
              创建家长账号
            </h1>
          </div>

          <form
            onSubmit={submit}
            className="rounded-3xl bg-white/80 backdrop-blur p-6 shadow-2xl ring-1 ring-white/40"
          >
            <label className="block mb-3">
              <span className="text-sm text-slate-600">手机号或邮箱</span>
              <input
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className="mt-1 w-full rounded-xl border-2 border-sky-200 bg-white px-4 py-3 outline-none focus:border-sky-400"
              />
            </label>
            <label className="block mb-3">
              <span className="text-sm text-slate-600">密码</span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 w-full rounded-xl border-2 border-sky-200 bg-white px-4 py-3 outline-none focus:border-sky-400"
              />
            </label>
            <label className="block mb-2">
              <span className="text-sm text-slate-600">再输一次密码</span>
              <input
                type="password"
                value={password2}
                onChange={(e) => setPassword2(e.target.value)}
                className="mt-1 w-full rounded-xl border-2 border-sky-200 bg-white px-4 py-3 outline-none focus:border-sky-400"
              />
            </label>

            {error && (
              <p className="text-sm text-rose-500 mt-1 mb-2">⚠ {error}</p>
            )}

            <Btn
              type="submit"
              size="lg"
              variant="secondary"
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
