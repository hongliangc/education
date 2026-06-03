// 模型网关 —— 按可用的 API Key 选择 provider（参考 AI 儿童教育平台方案的模型路由）。
//
//   面向孩子的实时对话：优先 DeepSeek（大陆直连、低成本）
//   没有 DeepSeek key 时：回退 Claude（Anthropic SDK）
//   两者都没有：mock（保持现有开发体验，零配置可跑）
//
// 大陆部署注意：高级模型（Claude / GPT / Gemini）在大陆服务器上直连不稳定，
// 建议经海外 Cloudflare Worker 中转。这里用 ANTHROPIC_BASE_URL 预留中转入口，
// 配上中转地址即可切换，无需改代码。

export type FairyProvider = "deepseek" | "claude" | "mock";

const DEEPSEEK_KEY = process.env.DEEPSEEK_API_KEY;
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY;
const DEEPSEEK_URL = "https://api.deepseek.com/v1/chat/completions";
// deepseek-chat 将于 2026-07-24 弃用（它只是 deepseek-v4-flash 的非思考别名），故直接用 v4-flash
const DEEPSEEK_MODEL = "deepseek-v4-flash";

const MOCK_REPLIES = [
  "你做得真棒！再接再厉哦 ✨",
  "嘿嘿，遇到不会的没关系，慢慢来 💖",
  "我也好喜欢这个故事！要不要再玩一关？🌟",
  "好厉害呀！再答对一题就升级啦 🚀",
  "勇敢的小朋友，让我们一起加油吧 🌈",
  "今天的你比昨天进步了一点点喔 🌱",
];

function mockReply(): string {
  return MOCK_REPLIES[Math.floor(Math.random() * MOCK_REPLIES.length)];
}

export function resolveFairyProvider(): FairyProvider {
  if (DEEPSEEK_KEY) return "deepseek";
  if (ANTHROPIC_KEY) return "claude";
  return "mock";
}

export interface ChatTurn {
  role: "user" | "fairy";
  content: string;
}

export interface GenerateArgs {
  system: string;
  userMessage: string;
  history?: ChatTurn[];
  maxTokens?: number;
}

export interface GenerateResult {
  reply: string;
  source: FairyProvider | "mock-fallback";
}

export async function generateFairyReply(
  args: GenerateArgs,
): Promise<GenerateResult> {
  const provider = resolveFairyProvider();
  try {
    if (provider === "deepseek") {
      return { reply: await callDeepSeek(args), source: "deepseek" };
    }
    if (provider === "claude") {
      return { reply: await callClaude(args), source: "claude" };
    }
  } catch (e) {
    console.error(`[fairy] provider "${provider}" failed:`, e);
    return { reply: mockReply(), source: "mock-fallback" };
  }
  return { reply: mockReply(), source: "mock" };
}

async function callDeepSeek({
  system,
  userMessage,
  history = [],
  maxTokens = 150,
}: GenerateArgs): Promise<string> {
  const res = await fetch(DEEPSEEK_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${DEEPSEEK_KEY}`,
    },
    body: JSON.stringify({
      model: DEEPSEEK_MODEL,
      max_tokens: maxTokens,
      // 关闭思考：v4-flash 默认是「思考」变体，精灵闲聊不需要推理。
      // 开着会先烧 ~100+ reasoning token 才出内容——既拖慢实时语音(~2.3s→~0.7s)，
      // 又会在 max_tokens 不够时把内容挤成空字符串（多轮空回复的根因）。
      thinking: { type: "disabled" },
      messages: [
        { role: "system", content: system },
        ...history.map((t) => ({
          role: t.role === "fairy" ? "assistant" : "user",
          content: t.content,
        })),
        { role: "user", content: userMessage },
      ],
    }),
  });
  if (!res.ok) throw new Error(`DeepSeek HTTP ${res.status}`);
  const data = await res.json();
  const content = (data.choices?.[0]?.message?.content ?? "").trim();
  // 空内容按失败处理 → 上层走 mock 兜底，绝不把空回复透传到前端
  if (!content) throw new Error("DeepSeek empty content");
  return content;
}

async function callClaude({
  system,
  userMessage,
  history = [],
  maxTokens = 150,
}: GenerateArgs): Promise<string> {
  const Anthropic = (await import("@anthropic-ai/sdk")).default;
  const client = new Anthropic(
    process.env.ANTHROPIC_BASE_URL
      ? { baseURL: process.env.ANTHROPIC_BASE_URL }
      : undefined,
  );
  const res = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: maxTokens,
    system,
    messages: [
      ...history.map((t) => ({
        role: (t.role === "fairy" ? "assistant" : "user") as "assistant" | "user",
        content: t.content,
      })),
      { role: "user" as const, content: userMessage },
    ],
  });
  const text = res.content
    .map((b) => (b.type === "text" ? b.text : ""))
    .join("\n")
    .trim();
  // 与 DeepSeek 一致：空内容按失败处理 → 上层走 mock 兜底，绝不透传空回复
  if (!text) throw new Error("Claude empty content");
  return text;
}

// 给 safety.ts 用的 AI 内容复核：优先走 DeepSeek（便宜、快）。
// 仅在 provider 为 deepseek 时由路由注入；其它情况走纯本地过滤。
export async function aiSafetyCheck(text: string): Promise<boolean> {
  if (!DEEPSEEK_KEY) throw new Error("no DeepSeek key for safety check");
  const res = await fetch(DEEPSEEK_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${DEEPSEEK_KEY}`,
    },
    body: JSON.stringify({
      model: DEEPSEEK_MODEL,
      max_tokens: 5,
      // 同 callDeepSeek：v4-flash 默认思考，会先烧 reasoning token，
      // 5 token 预算下正文必空 → YES/NO 判定恒为 NO（误杀正常内容）。
      thinking: { type: "disabled" },
      messages: [
        {
          role: "user",
          content: `这句话是否适合 3–10 岁儿童？只回复 YES 或 NO："${text}"`,
        },
      ],
    }),
  });
  if (!res.ok) throw new Error(`DeepSeek safety HTTP ${res.status}`);
  const data = await res.json();
  return (data.choices?.[0]?.message?.content ?? "")
    .trim()
    .toUpperCase()
    .startsWith("YES");
}
