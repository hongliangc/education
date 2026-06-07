const LOCAL_REALTIME_TERMS =
  /(附近|周边|营业时间|营业到|几点开门|几点关门|开门吗|关门吗|开放吗|地址|在哪里|怎么去|门票|票价|预约|排队|最新活动|今天.*活动|现在.*开放)/;

const GENERAL_REALTIME_TERMS = /(最新|最近|新闻|本周|今年|刚刚|实时)/;

const PLACE_TERMS =
  /(游乐园|乐园|商场|购物中心|公园|博物馆|科技馆|动物园|水族馆|影院|电影院|餐厅|饭店|医院|景点|酒店|书店|迪士尼)/;

const QUERY_NOISE =
  /(小精灵|小星|请问|请告诉我|告诉我|帮我|查一下|看一下|看看|附近|周边|今天|现在|目前|最新|有什么|有哪些|哪里有|营业时间|营业到|几点开门|几点关门|开门吗|关门吗|开放吗|地址|在哪里|怎么去|门票|票价|预约|排队|活动|游乐园|乐园|商场|购物中心|公园|博物馆|科技馆|动物园|水族馆|影院|电影院|餐厅|饭店|医院|景点|酒店|书店|吗|呢|呀|啊)/g;

export interface RealtimeQuestion {
  isRealtimeQuestion: boolean;
  locationRequired: boolean;
  hasLocation: boolean;
}

export interface SearchResult {
  title: string;
  url: string;
  content: string;
}

interface TavilyResponse {
  results?: Array<{
    title?: unknown;
    url?: unknown;
    content?: unknown;
  }>;
}

export class SearchNotConfiguredError extends Error {}
export class SearchUnavailableError extends Error {}

export function parseRealtimeQuestion(message: string): RealtimeQuestion {
  const normalized = message.trim().replace(/[，。！？、,.!?]/g, "");
  const isLocalQuestion =
    LOCAL_REALTIME_TERMS.test(normalized) &&
    (PLACE_TERMS.test(normalized) ||
      /(营业|开放|门票|票价|活动|地址|怎么去)/.test(normalized));
  const isGeneralRealtimeQuestion = GENERAL_REALTIME_TERMS.test(normalized);
  const isRealtimeQuestion = isLocalQuestion || isGeneralRealtimeQuestion;

  if (!isRealtimeQuestion) {
    return {
      isRealtimeQuestion: false,
      locationRequired: false,
      hasLocation: false,
    };
  }

  const locationHint = normalized.replace(QUERY_NOISE, "").trim();
  return {
    isRealtimeQuestion: true,
    locationRequired: isLocalQuestion,
    hasLocation: isLocalQuestion && locationHint.length >= 2,
  };
}

export async function searchRealtimeInfo(
  query: string,
): Promise<SearchResult[]> {
  const apiKey = process.env.TAVILY_API_KEY;
  if (!apiKey) throw new SearchNotConfiguredError("Missing TAVILY_API_KEY");

  let response: Response;
  try {
    response = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query,
        topic: "general",
        search_depth: "basic",
        max_results: 3,
        include_answer: false,
        include_raw_content: false,
        include_images: false,
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(8_000),
    });
  } catch {
    throw new SearchUnavailableError("Search request failed");
  }

  if (!response.ok) {
    throw new SearchUnavailableError(`Search HTTP ${response.status}`);
  }

  const data = (await response.json()) as TavilyResponse;
  const results = (data.results ?? []).flatMap((result) => {
    if (
      typeof result.title !== "string" ||
      typeof result.url !== "string" ||
      typeof result.content !== "string"
    ) {
      return [];
    }

    try {
      const url = new URL(result.url);
      if (url.protocol !== "https:" && url.protocol !== "http:") return [];
      return [
        {
          title: cleanText(result.title, 50),
          url: url.toString(),
          content: cleanText(result.content, 120),
        },
      ];
    } catch {
      return [];
    }
  });

  if (results.length === 0) {
    throw new SearchUnavailableError("Search returned no usable results");
  }
  return results;
}

export function formatSearchReply(
  query: string,
  results: SearchResult[],
): string {
  if (results.length === 0) {
    return `我暂时没查到“${cleanText(query, 30)}”的可靠信息，请和爸爸妈妈换个说法再试试吧！`;
  }

  const summaries = results
    .map((result, index) => `${index + 1}. ${result.title}：${result.content}`)
    .join("\n");
  const sources = results.map((result) => result.url).join(" ");
  return `我查到这些信息：\n${summaries}\n信息可能会变化，出发前请和爸爸妈妈查看来源确认哦！\n来源：${sources}`;
}

function cleanText(text: string, maxLength: number): string {
  const cleaned = text.replace(/\s+/g, " ").trim();
  return cleaned.length <= maxLength
    ? cleaned
    : `${cleaned.slice(0, maxLength - 1)}…`;
}
