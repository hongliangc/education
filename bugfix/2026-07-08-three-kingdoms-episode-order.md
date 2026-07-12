# 三国演义剧集顺序仍然混乱

- id: `2026-07-08-three-kingdoms-episode-order`
- status: fixed
- commit: pending

## 现象与复现
- 本地影院中“三国演义”剧集仍然没有按第 1 集、第 2 集等自然顺序排列。
- 复现入口：本地 release 栈 `http://localhost/theater`，进入三国演义视频目录。

## 根因
- 三国演义 94 版文件名是 `01桃园三结义.mkv`、`20孙策之死.mkv` 这种“集数直接接中文标题”的格式。
- 之前的剧集排序只识别 `第01集`、`EP01`、`01.标题` 等格式，没有识别裸数字前缀，所以 OpenList 返回乱序时目录也保持乱序。

## 修复
- 扩展剧集号解析：支持 1-3 位开头数字直接接非数字字符的中文剧集文件名。
- 规则仍不识别 4 位裸数字，避免把 `2023电影` 之类年份误判为集数。

## 回归测试
- `tests/video/episode-order.test.ts` 覆盖 `01桃园三结义`、`20孙策之死` 和 `2023电影`。
- `tests/video/openlist-catalog.test.ts` 覆盖乱序的三国演义文件名，确认目录按 `01`、`02`、`05`、`20`、`78` 排列。

## 验证
- `node --test tests/video/episode-order.test.ts tests/video/openlist-catalog.test.ts`
- `npx tsc --noEmit`
- `bash scripts/release.sh local`
- 清理本地 `VideoCatalogCache` 后，以体验账号请求 `/api/videos?childId=...&refresh=1`，返回三国演义 84 集，前 10 集为 `01桃园三结义` 到 `10辕门射戟`，最后为 `84三分归晋`。
