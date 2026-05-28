import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

// 当前 Phase 2 暂用 mock 回复。
// 填入 ANTHROPIC_API_KEY 后自动切真实 Claude API（见下方分支）。

const HAS_KEY = !!process.env.ANTHROPIC_API_KEY;

const MOCK_REPLIES = [
  "你做得真棒！再接再厉哦 ✨",
  "嘿嘿，遇到不会的没关系，慢慢来 💖",
  "我也好喜欢这个故事！要不要再玩一关？🌟",
  "好厉害呀！再答对一题就升级啦 🚀",
  "勇敢的小朋友，让我们一起加油吧 🌈",
  "今天的你比昨天进步了一点点喔 🌱",
];

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { message, childName, age, recentModule, stars } = await req
    .json()
    .catch(() => ({}));

  if (!HAS_KEY) {
    const reply = MOCK_REPLIES[Math.floor(Math.random() * MOCK_REPLIES.length)];
    return NextResponse.json({ reply, source: "mock" });
  }

  // 真实 Claude 调用（仅在配置了 API Key 时启用）
  try {
    const Anthropic = (await import("@anthropic-ai/sdk")).default;
    const client = new Anthropic();
    const res = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 150,
      system: `你是魔法学习王国的精灵小星，专门陪伴 ${age ?? 6} 岁的 ${
        childName ?? "小朋友"
      } 学习。语气温柔活泼，每句 10-20 字，多用 emoji。孩子刚完成了 ${
        recentModule ?? "练习"
      }，获得了 ${stars ?? 0} 颗星。不涉及暴力、恐怖、成人内容；遇到不适当问题请转移话题。`,
      messages: [{ role: "user", content: String(message ?? "你好") }],
    });

    const reply = res.content
      .map((b) => (b.type === "text" ? b.text : ""))
      .join("\n")
      .trim();

    return NextResponse.json({ reply, source: "claude" });
  } catch (e) {
    console.error("Claude API failed:", e);
    const reply = MOCK_REPLIES[Math.floor(Math.random() * MOCK_REPLIES.length)];
    return NextResponse.json({ reply, source: "mock-fallback" });
  }
}
