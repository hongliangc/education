import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { buildFairyPrompt } from "@/lib/ai/prompts";
import { checkContentSafety } from "@/lib/ai/safety";
import {
  aiSafetyCheck,
  generateFairyReply,
  resolveFairyProvider,
} from "@/lib/ai/gateway";
import {
  fetchCurrentWeather,
  formatWeatherReply,
  parseWeatherQuestion,
  WeatherLocationNotFoundError,
} from "@/lib/weather/fairy-weather";
import {
  formatSearchReply,
  parseRealtimeQuestion,
  searchRealtimeInfo,
  SearchNotConfiguredError,
} from "@/lib/search/fairy-search";

// 精灵对话：模型网关按可用 Key 选 provider（DeepSeek / Claude / mock），
// 调用前先做两段式内容安全检查。零配置时全程走 mock，开发体验不变。
export async function POST(req: Request) {
  // 总等待诊断：LLM 生成回复是首句出声前最大的一段（远超 TTS 首帧 ~500ms）。记录其耗时与整段处理耗时。
  const t0 = Date.now();
  const ua = req.headers.get("user-agent") ?? "";
  const dev = /iPhone|iPad|iPod/i.test(ua) ? "ios" : /Android/i.test(ua) ? "android" : "pc";
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { message, history, childName, age, recentModule, stars, context } =
    await req.json().catch(() => ({}));
  const userMessage = String(message ?? "你好");
  // 接地内容（当前名句/寓言原文+解读）：限长裁剪，纳入提示注入防护，只作参考资料
  const safeContext =
    typeof context === "string" ? context.slice(0, 800) : undefined;

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

  const weatherQuestion = parseWeatherQuestion(userMessage);
  if (weatherQuestion.isWeatherQuestion && weatherQuestion.city) {
    try {
      const weather = await fetchCurrentWeather(weatherQuestion.city);
      return NextResponse.json({
        reply: formatWeatherReply(weather),
        source: "open-meteo",
      });
    } catch (error) {
      const reply =
        error instanceof WeatherLocationNotFoundError
          ? `我还没找到“${weatherQuestion.city}”这个城市。你可以换成城市名再问一次哦！🌍`
          : "天气服务暂时开小差了，请过一会儿再问我吧！🌦️";
      return NextResponse.json({ reply, source: "weather-unavailable" });
    }
  }

  const realtimeQuestion = parseRealtimeQuestion(userMessage);
  if (realtimeQuestion.isRealtimeQuestion) {
    if (realtimeQuestion.locationRequired && !realtimeQuestion.hasLocation) {
      return NextResponse.json({
        reply:
          "请告诉我城市、区或附近的地标哦！比如“北京朝阳区附近有什么游乐园？”📍",
        source: "search-location-required",
      });
    }

    try {
      const results = await searchRealtimeInfo(userMessage);
      return NextResponse.json({
        reply: formatSearchReply(userMessage, results),
        source: "tavily",
      });
    } catch (error) {
      const reply =
        error instanceof SearchNotConfiguredError
          ? "联网搜索还没有配置好，请让爸爸妈妈先设置搜索服务哦！🔎"
          : "联网搜索暂时开小差了，请过一会儿再问我吧！🔎";
      return NextResponse.json({ reply, source: "search-unavailable" });
    }
  }

  const system = buildFairyPrompt({
    childName,
    age,
    recentModule,
    stars,
    context: safeContext,
  });
  const tGen = Date.now();
  const { reply, source } = await generateFairyReply({
    system,
    userMessage,
    history: safeHistory,
    maxTokens: 200,
  });
  console.log(
    `[fairy-chat] llm=${Date.now() - tGen} total=${Date.now() - t0} ` +
      `source=${source} dev=${dev} qlen=${userMessage.length} rlen=${String(reply ?? "").length}`,
  );

  return NextResponse.json({ reply, source });
}
