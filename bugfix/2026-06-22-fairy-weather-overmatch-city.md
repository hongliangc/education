# 小精灵把普通问题误判成天气/城市查询，回答「找不到城市」

- id: `2026-06-22-fairy-weather-overmatch-city`
- status: done
- commit: this commit

## 现象与复现
- 问小精灵和城市无关、也不是问城市的问题，它偶尔回「我还没找到"…"这个城市」。
- 复现：问含天气词的解释类问题，如「为什么会下雨？」「雪是怎么形成的？」
  → `parseWeatherQuestion` 命中天气词，把剩余文本（"为什么会"/"雪是怎么形成"）当城市去
  地理编码 → 失败 → 回「找不到城市」。
- 同类：`parseRealtimeQuestion` 里 `最近|最新` 等极常见词单独命中（如「我最近学了拼音」），
  把普通闲聊错送联网搜索。

## 根因
- 天气/搜索是 LLM 之前的**关键词预路由**，过于激进：
  1. `lib/weather/fairy-weather.ts`：只要含 `天气|气温|温度|下雨|下雪|…` 就判为天气问题，
     再把"去噪后剩余文本"无条件当城市名。解释类问题（为什么/怎么形成）含天气词时被劫持，
     残余文本必然不是城市 → `WeatherLocationNotFoundError` → 「找不到城市」。
  2. `lib/search/fairy-search.ts`：`GENERAL_REALTIME_TERMS = /(最新|最近|…)/` 中 `最近/最新`
     是日常高频词，单独出现即误判为实时联网问题。

## 修复
- `parseWeatherQuestion`：① 加解释类问题护栏（含 为什么/为啥/怎么/咋/原理/是什么/解释/科学/
  形成/造成 → 直接返回 `isWeatherQuestion:false`，交 LLM）；② 仅当能提取出**像样的城市名**
  （去噪后 2–8 字、纯地名字符、无疑问词/动词残渣）时才返回 `{isWeatherQuestion:true, city}`，
  否则返回 `false`（含天气词但无干净城市 → 交 LLM）。彻底删掉「把残余当城市」这条路径。
- `parseRealtimeQuestion`：保留边界清晰的「附近+场所」本地搜索路径；收紧通用实时路径——
  `最近/最新/本周/…` 必须与时事名词（新闻/比赛/比分/上映/发布/价格/多少钱/排行/发现）共现才命中，
  并同样加解释类问题护栏。
- 行为变化（符合需求「其余全交 LLM」）：含天气词但无城市的问题（如「今天天气怎么样」）不再追问
  城市，而是交给 LLM 自然回应。

## 回归测试
- `tests/fairy/weather.test.ts`、`tests/fairy/realtime-search.test.ts`：新增误判用例
  （为什么会下雨 / 雪是怎么形成的 / 我最近学了拼音 等 → 不拦截），并更新「无城市」用例预期。

## 验证
- `npx tsc --noEmit` 通过；`node --test tests/**/*.test.ts` 全绿（288 通过）。
- 现场 `npm run dev` + `curl -X POST /api/fairy/chat`（未登录）→ `HTTP 401`。
- 护栏在两处解析器内联（`EXPLANATORY` regex + `isExplanatoryQuestion`），保持一致；未跨目录共享
  以避开 `node --test` 原生 TS 对 `../x.ts` 父级路径的解析限制。
