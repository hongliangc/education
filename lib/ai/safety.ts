// 两段式内容安全（参考 AI 儿童教育平台方案）：
//   ① 本地黑名单/正则过滤 —— 零延迟、零成本，拦掉最严重的内容。
//   ② 仅对「可疑但未命中黑名单」的内容，再调 AI 复核（按需注入，避免对正常提问花钱）。
// 面向 3–10 岁儿童 + 大陆合规。注意：可疑正则里有「死/血」等常见字，
// 在没有 AI 复核器时对它们放行，避免误伤「恐龙为什么会死」这类正常提问。

const BLOCKLIST = [
  // 政治敏感
  "政治",
  "台独",
  "台湾独立",
  "港独",
  "藏独",
  "疆独",
  "天安门",
  "法轮功",
  // 暴恐 / 危险行为
  "自杀",
  "枪支",
  "枪械",
  "炸弹",
  "制毒",
  "毒品",
  "恐怖袭击",
  // 成人
  "色情",
  "做爱",
  "性交",
];

// 命中这些字符才升级到 AI 复核（绝大多数正常提问直接放行）
const SUSPICIOUS = /[政军战杀死血毒炸枪]/;

export interface SafetyResult {
  safe: boolean;
  reason?: string;
}

export type AiSafetyCheck = (text: string) => Promise<boolean>;

export async function checkContentSafety(
  text: string,
  aiCheck?: AiSafetyCheck,
): Promise<SafetyResult> {
  const raw = text ?? "";
  const normalized = raw.toLowerCase();

  // ① 本地黑名单
  const hit = BLOCKLIST.find((kw) => normalized.includes(kw.toLowerCase()));
  if (hit) return { safe: false, reason: `命中敏感词：${hit}` };

  // ② 完全正常的内容直接放行，省成本
  if (!SUSPICIOUS.test(raw)) return { safe: true };

  // ③ 可疑内容 + 提供了 AI 复核 → 交给 AI 判断
  if (aiCheck) {
    try {
      const ok = await aiCheck(raw);
      return ok ? { safe: true } : { safe: false, reason: "AI 复核未通过" };
    } catch {
      // 复核失败时从严：可疑内容默认拦截
      return { safe: false, reason: "AI 复核异常，按可疑处理" };
    }
  }

  // ④ 无 AI 复核器（纯本地模式）：可疑但未命中黑名单 → 放行，避免误伤
  return { safe: true };
}
