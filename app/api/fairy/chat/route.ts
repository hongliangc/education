import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { buildFairyPrompt } from "@/lib/ai/prompts";
import { checkContentSafety } from "@/lib/ai/safety";
import {
  aiSafetyCheck,
  generateFairyReply,
  resolveFairyProvider,
} from "@/lib/ai/gateway";

// 精灵对话：模型网关按可用 Key 选 provider（DeepSeek / Claude / mock），
// 调用前先做两段式内容安全检查。零配置时全程走 mock，开发体验不变。
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { message, history, childName, age, recentModule, stars } = await req
    .json()
    .catch(() => ({}));
  const userMessage = String(message ?? "你好");

  // 多轮历史：只取最近 6 条、裁剪单条长度，防 token 膨胀与提示注入
  const safeHistory = Array.isArray(history)
    ? history
        .filter(
          (t: unknown): t is { role: "user" | "fairy"; content: string } =>
            !!t &&
            typeof t === "object" &&
            ((t as { role?: string }).role === "user" ||
              (t as { role?: string }).role === "fairy") &&
            typeof (t as { content?: unknown }).content === "string",
        )
        .slice(-6)
        .map((t) => ({ role: t.role, content: t.content.slice(0, 500) }))
    : [];

  // 内容安全：本地黑名单 + 可疑内容 AI 复核（仅在有 DeepSeek key 时启用复核）
  const provider = resolveFairyProvider();
  const safety = await checkContentSafety(
    userMessage,
    provider === "deepseek" ? aiSafetyCheck : undefined,
  );
  if (!safety.safe) {
    return NextResponse.json({
      reply: "这个问题很有意思，我们和爸爸妈妈一起探索吧～ 🌟",
      source: "safety-blocked",
    });
  }

  const system = buildFairyPrompt({ childName, age, recentModule, stars });
  const { reply, source } = await generateFairyReply({
    system,
    userMessage,
    history: safeHistory,
    maxTokens: 200,
  });

  return NextResponse.json({ reply, source });
}
