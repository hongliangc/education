# 阿里云盘 HLS 浏览器请求被 Referer 拒绝

- id: `2026-06-14-alipan-hls-referer-403`
- status: done
- commit: this commit

## 现象与复现
- 视频播放提示“视频连接不稳定，稍后再试”。
- 同一 M3U8 和分片请求不带 Referer 返回 200，携带浏览器页面 Referer 返回 403。

## 根因
- hls.js 默认 FetchLoader 继承页面 Referrer 策略，浏览器请求阿里云盘 M3U8 和分片时携带应用页面 Referer。
- 阿里云盘预览域名对无 Referer 请求返回 200，但对该浏览器 Referer 返回 403。

## 修复
- hls.js `fetchSetup` 创建 `referrerPolicy: no-referrer` 的 Request。
- `<video>` 同时设置 `referrerPolicy="no-referrer"`，覆盖 Safari 原生 HLS。

## 回归测试
- `tests/video/hls-referrer-policy.test.ts` 验证 hls.js Request 不携带 Referer。
- 同一测试验证原生 HLS 在设置 `src` 前写入 `referrerpolicy=no-referrer`。

## 验证
- 视频相关 5 个测试文件通过。
- `npx tsc --noEmit` 通过。
- `npm run build` 通过。
