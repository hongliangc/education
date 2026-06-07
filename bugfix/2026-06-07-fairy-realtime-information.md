# 小精灵无法回答实时信息

- id: `2026-06-07-fairy-realtime-information`
- status: verified
- commit: this commit

## 现象与复现
- 向小精灵询问当天的天气、附近游乐园、商场、营业时间或最新信息时，无法得到实时结果。
- 最小复现：询问“北京今天天气怎么样？”或“北京朝阳区附近有什么游乐园？”

## 根因
- `/api/fairy/chat` 只把文本发送给 DeepSeek、Claude 或 mock，没有注册联网搜索工具，也没有实时数据源。
- 大模型服务端调用不会自动联网；没有地点时，附近查询也缺少必要参数。

## 修复
- 天气问题提取显式城市，通过 Open-Meteo 地理编码和天气 API 查询当前天气、体感、当天高低温及降雨概率。
- 附近地点、营业时间、票价和通用最新信息通过 Tavily Search 查询，限制为 3 条摘要。
- 附近查询缺少城市、区或地标时先追问；无搜索 Key 或外部服务失败时返回明确降级提示。
- 在 `.env.example` 增加服务端 `TAVILY_API_KEY` 配置说明。

## 回归测试
- `tests/fairy/weather.test.ts` 覆盖天气意图、城市提取和回答格式。
- `tests/fairy/realtime-search.test.ts` 覆盖附近地点、地点追问、通用最新信息和搜索摘要格式。

## 验证
- `node --experimental-strip-types --test tests/fairy/realtime-search.test.ts tests/fairy/weather.test.ts tests/fairy/hold-to-talk.test.ts`
- `npx tsc --noEmit`
- 未登录 `POST /api/fairy/chat` 返回 `401`。
- 实际调用 Open-Meteo 查询北京天气成功。
- 本机未配置 `TAVILY_API_KEY`，真实通用搜索请求未联调；未配置降级路径已实现。
