// 解释/原理类问题护栏：「为什么会下雨」「雪是怎么形成的」是知识问题，应交 LLM 讲解，别被
// 天气关键词预路由劫持（否则把句子残余当城市、回「找不到城市」）。故意不含「怎么样」——它是
// 天气查询的正常说法。与 lib/search/fairy-search.ts 中同名护栏保持一致。
const EXPLANATORY =
  /为什么|为啥|为何|怎么形成|怎么来的|怎么回事|怎么产生|什么原理|原理是|解释一下|科学道理|形成|造成/;
function isExplanatoryQuestion(text: string): boolean {
  return EXPLANATORY.test(text);
}

const WEATHER_TERMS =
  /(天气|气温|温度|下雨|下雪|降雨|降雪|冷不冷|热不热|冷吗|热吗)/;

const CITY_NOISE =
  /(小精灵|小星|请问|请告诉我|告诉我|帮我|查一下|看一下|看看|今天|今日|当天|明天|后天|大后天|昨天|前天|这几天|未来几天|未来|周末|这周|本周|早上|上午|中午|下午|晚上|白天|夜里|现在|目前|此刻|的|天气|气温|温度|会不会下雨|会下雨|下雨|降雨|会不会下雪|会下雪|下雪|降雪|冷不冷|热不热|冷吗|热吗|怎么样|如何|多少度|几度|吗|呢|呀|啊)/g;

// 像样的城市名：2–8 个汉字（含间隔号，如「呼和浩特」「乌鲁木齐」），且不含疑问 / 语气 / 助词残渣。
// 真实地名不会含 是/什么/怎/为/会/的 等字；以此把「为什么会(下雨)」「是什么(样)」这类残余挡在外面。
const CITY_REJECT = /[是什么怎为吗呢啊哪会要能可以的了过着吧嘛样多少几]/;
function isPlausibleCity(s: string): boolean {
  return /^[一-龥·]{2,8}$/.test(s) && !CITY_REJECT.test(s);
}

export interface WeatherQuestion {
  isWeatherQuestion: boolean;
  city?: string;
}

export interface CurrentWeather {
  city: string;
  weatherCode: number;
  temperature: number;
  apparentTemperature: number;
  temperatureMax: number;
  temperatureMin: number;
  precipitationProbability: number;
}

interface GeocodingResponse {
  results?: Array<{
    name?: unknown;
    latitude?: unknown;
    longitude?: unknown;
  }>;
}

interface ForecastResponse {
  current?: {
    temperature_2m?: unknown;
    apparent_temperature?: unknown;
    weather_code?: unknown;
  };
  daily?: {
    temperature_2m_max?: unknown[];
    temperature_2m_min?: unknown[];
    precipitation_probability_max?: unknown[];
  };
}

export class WeatherLocationNotFoundError extends Error {}
export class WeatherUnavailableError extends Error {}

export function parseWeatherQuestion(message: string): WeatherQuestion {
  const normalized = message.trim().replace(/[，。！？、,.!?]/g, "");
  // 必须含天气词；解释类问题（为什么/怎么形成）一律交 LLM，不走天气查询。
  if (!WEATHER_TERMS.test(normalized) || isExplanatoryQuestion(normalized)) {
    return { isWeatherQuestion: false };
  }

  // 仅当能提取出「像样的城市名」时才判为天气查询；否则（含天气词但无干净城市，如
  // 「今天天气怎么样」）交 LLM 自然回应——不再把句子残余当城市去地理编码、回「找不到城市」。
  const city = normalized.replace(CITY_NOISE, "").trim();
  if (!isPlausibleCity(city)) {
    return { isWeatherQuestion: false };
  }

  return { isWeatherQuestion: true, city };
}

export async function fetchCurrentWeather(
  cityQuery: string,
): Promise<CurrentWeather> {
  const geocodingUrl = new URL(
    "https://geocoding-api.open-meteo.com/v1/search",
  );
  geocodingUrl.searchParams.set("name", cityQuery);
  geocodingUrl.searchParams.set("count", "1");
  geocodingUrl.searchParams.set("language", "zh");
  geocodingUrl.searchParams.set("format", "json");

  const locationResponse = await fetchWithTimeout(geocodingUrl);
  const locationData = (await locationResponse.json()) as GeocodingResponse;
  const location = locationData.results?.[0];
  if (
    !location ||
    typeof location.name !== "string" ||
    typeof location.latitude !== "number" ||
    typeof location.longitude !== "number"
  ) {
    throw new WeatherLocationNotFoundError(cityQuery);
  }

  const forecastUrl = new URL("https://api.open-meteo.com/v1/forecast");
  forecastUrl.searchParams.set("latitude", String(location.latitude));
  forecastUrl.searchParams.set("longitude", String(location.longitude));
  forecastUrl.searchParams.set(
    "current",
    "temperature_2m,apparent_temperature,weather_code",
  );
  forecastUrl.searchParams.set(
    "daily",
    "temperature_2m_max,temperature_2m_min,precipitation_probability_max",
  );
  forecastUrl.searchParams.set("timezone", "auto");
  forecastUrl.searchParams.set("forecast_days", "1");

  const forecastResponse = await fetchWithTimeout(forecastUrl);
  const forecast = (await forecastResponse.json()) as ForecastResponse;
  const weather = {
    city: location.name,
    weatherCode: forecast.current?.weather_code,
    temperature: forecast.current?.temperature_2m,
    apparentTemperature: forecast.current?.apparent_temperature,
    temperatureMax: forecast.daily?.temperature_2m_max?.[0],
    temperatureMin: forecast.daily?.temperature_2m_min?.[0],
    precipitationProbability:
      forecast.daily?.precipitation_probability_max?.[0],
  };

  if (
    typeof weather.weatherCode !== "number" ||
    typeof weather.temperature !== "number" ||
    typeof weather.apparentTemperature !== "number" ||
    typeof weather.temperatureMax !== "number" ||
    typeof weather.temperatureMin !== "number" ||
    typeof weather.precipitationProbability !== "number"
  ) {
    throw new WeatherUnavailableError("Invalid weather response");
  }

  return weather as CurrentWeather;
}

export function formatWeatherReply(weather: CurrentWeather): string {
  const condition = describeWeatherCode(weather.weatherCode);
  const emoji = weatherEmoji(weather.weatherCode);
  return `${weather.city}现在${condition}，约 ${Math.round(weather.temperature)}°C，体感 ${Math.round(weather.apparentTemperature)}°C。今天 ${Math.round(weather.temperatureMin)}～${Math.round(weather.temperatureMax)}°C，最高降雨概率 ${Math.round(weather.precipitationProbability)}%。出门前再看看天空，和爸爸妈妈一起选合适的衣服吧！${emoji}`;
}

async function fetchWithTimeout(url: URL): Promise<Response> {
  try {
    const response = await fetch(url, {
      cache: "no-store",
      signal: AbortSignal.timeout(5_000),
    });
    if (!response.ok) {
      throw new WeatherUnavailableError(`Weather HTTP ${response.status}`);
    }
    return response;
  } catch (error) {
    if (error instanceof WeatherUnavailableError) throw error;
    throw new WeatherUnavailableError("Weather request failed");
  }
}

function describeWeatherCode(code: number): string {
  if (code === 0) return "晴朗";
  if (code <= 2) return "大致晴朗";
  if (code === 3) return "多云";
  if (code <= 48) return "有雾";
  if (code <= 57) return "有毛毛雨";
  if (code <= 67) return "有雨";
  if (code <= 77) return "有雪";
  if (code <= 82) return "有阵雨";
  if (code <= 86) return "有阵雪";
  return "可能有雷雨";
}

function weatherEmoji(code: number): string {
  if (code <= 2) return "☀️";
  if (code === 3 || code <= 48) return "☁️";
  if (code <= 67 || (code >= 80 && code <= 82)) return "🌧️";
  if (code <= 77 || (code >= 85 && code <= 86)) return "❄️";
  return "⛈️";
}
