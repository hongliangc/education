# 阿里云盘 HLS 浏览器请求被 Referer 拒绝

- id: `2026-06-14-alipan-hls-referer-403`
- status: done
- commit: this commit

## 现象与复现
- 视频播放提示“视频连接不稳定，稍后再试”。
- 同一 M3U8 和分片请求不带 Referer 返回 200，携带浏览器页面 Referer 返回 403。

## 根因
- 阿里云盘 video-preview 预览域名对无 Referer 请求返回 200，但对携带应用页面 Referer 的请求返回 403（防盗链）。
- **关键修正**：hls.js 1.6.16 默认加载器是 **XhrLoader**（`DefaultConfig.loader = XhrLoader`，FetchLoader 在源码里被注释），`fetchSetup` 仅对 FetchLoader 生效。播放器未切换加载器，所以首版用 `fetchSetup` 构造 no-referrer Request 的修复对 Chrome 路径**完全失效**——XHR 无法按请求剥离 Referer（forbidden header），仍带页面 Referer → 403 → fatal network error → “视频连接不稳定”。

## 修复
- **文档级 Referrer 策略**：`app/layout.tsx` metadata `referrer: "no-referrer"`，渲染 `<meta name="referrer" content="no-referrer">`。文档级策略是默认 XhrLoader 取流请求唯一能去掉 Referer 的机制，同时覆盖 fetch 与原生 `<video>`。
- 保留 hls.js `fetchSetup` 的 no-referrer Request 与 `<video referrerpolicy="no-referrer">` 作为纵深防御（FetchLoader / Safari 原生路径）。
- CORS 已核验：无 Referer + 带 Origin 时 manifest 返回 200 且 `Access-Control-Allow-Origin: *`，分片同源同 CDN，无需服务端代理。

## 回归测试
- `tests/video/hls-referrer-policy.test.ts` 验证 hls.js Request 不携带 Referer，且原生 HLS 在设置 `src` 前写入 `referrerpolicy=no-referrer`。
- 同文件新增断言：`app/layout.tsx` 声明了文档级 `referrer: "no-referrer"`（防止该有效修复被误删）。

## 验证
- 视频相关测试文件全部通过；`npx tsc --noEmit` 通过；`npm run build` 通过。
- 重建预览镜像后，容器内 `/theater` 渲染 HTML 实测含 `<meta name="referrer" content="no-referrer">`。
