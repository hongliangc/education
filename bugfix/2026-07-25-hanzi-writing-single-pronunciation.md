# 汉字书写单字只朗读一次

- id: `2026-07-25-hanzi-writing-single-pronunciation`
- status: verified
- commit: pending

## 现象与复现
- 在汉字书写页点击“听这个字”，当前汉字应只朗读一次，例如“六”。

## 根因
- 点击事件只调用一次语音接口，但孤立单字直接作为云 TTS 文本，缺少明确的句末边界；不同音色可能把孤立字处理成不稳定的短语气。

## 修复
- 云 TTS 文本使用“当前汉字 + 中文句号”固定为一个完整语音单元；浏览器回退文本仍只保留当前汉字。

## 回归测试
- Playwright 监听“听这个字”点击后的 `/api/speech/tts` 请求，验证只发送一次，并且文本为一个汉字加句末边界。

## 验证
- 语音专项 Playwright 3/3 通过；一次点击只产生一次请求。
- 汉字域测试 81/81、TypeScript、production build 与 diff 检查通过。
