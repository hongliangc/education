"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { Btn } from "@/components/Btn";
import { CloudBG } from "@/components/CloudBG";

export default function LoginPage() {
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
      <CloudBG />
      <main className="min-h-screen flex items-center justify-center px-5 py-10">
        <div className={`w-full max-w-sm ${shake ? "anim-shake" : ""} anim-slide-up`}>
          <div className="text-center mb-6">
            <div className="text-7xl anim-float inline-block">🧚</div>
            <h1 className="text-4xl font-bold text-white drop-shadow-lg mt-2">
              魔法学习王国
            </h1>
            <p className="text-white/90 mt-1">和精灵小星一起冒险吧 ✨</p>
          </div>

          <form
            onSubmit={submit}
            className="rounded-3xl bg-white/80 backdrop-blur p-6 shadow-2xl ring-1 ring-white/40"
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

            <div className="flex items-center justify-between text-sm mt-4 text-slate-500">
              <Link href="/register" className="underline decoration-pink-400">
                还没账号？去注册
              </Link>
              <span className="text-xs">微信/Google 登录待接入</span>
            </div>
          </form>
        </div>
      </main>
    </>
  );
}
