# 英语模块已合并但导航不可达：用新英语 Hub 替换旧字母关

- id: `2026-06-18-english-module-unwired`
- status: done
- commit: this commit

## 现象与复现
- 英语模块改造「体验不到」，用户怀疑没合并到 main / 启动显示有问题。

## 根因
- 英语**已并入 main**（已核验：`main..feat/english-scene-demo` 领先 0 commit、`merge-base --is-ancestor feat/english-scene-demo main` 为真、`90ea722` 同时在 main 与 english 分支）。所以不是没合并、也不是构建问题。
- 真因：新 `EnglishHub` 只挂在独立路由 `app/english-demo/page.tsx`（不在 `(game)` 组、无 HUD），世界地图模块列表无英语入口、全仓无任何链接；页面注释自述是「wiring into the graded platform 之前的 demo」。→ **已合并但未接线**，只能手敲 URL 进。

## 修复（用户选「用新英语 Hub 替换旧字母关」）
- 新建 `app/(game)/english/page.tsx` 渲染 `<EnglishHub/>`（放 `(game)` 组以获得 HUD/精灵，与正式模块一致）。
- 世界地图 `app/(game)/world/page.tsx` 的 `ROUTE_OVERRIDE` 增加 `ALPHABET: "/english"`（原 ALPHABET 走 `/play/alphabet` 的旧 `AlphabetGame` 不再被链接）。
- `MODULE_META.ALPHABET`（`lib/utils.ts:23`）文案改成英语（`label` 改「英语岛」/ emoji 可留 🔤），**保持 `ModuleId` 仍为 `ALPHABET`**（不改 id，避免动 progress / sessions / SLUGS）。
- `app/english-demo/page.tsx` 重定向到 `/english`（或删除），避免两份。
- 旧 `/play/alphabet` + `AlphabetGame` 代码保留（孤立不删），规避破坏。

## 已知取舍（非阻断，记录待定）
- 新 Hub 暂不上报 session/星星，世界地图 ALPHABET 节点星级会恒为 ☆☆☆，旧字母关闯关计星暂失；后续可在 Hub 内接 `onSessionComplete`。先满足「能进入体验」。

## 回归测试
- `node --test tests/english/wiring.test.ts tests/fairy/chat-speech.test.ts tests/video/catalog-cache.test.ts` 通过。
- `npx tsc --noEmit` 通过。
- `npm run build` 通过；构建路由表包含 `/english` 与 `/english-demo`。
- `bash scripts/check-agent-context.sh`（若改了入口/Skills 才需，此处不涉及可略）。

## 验证
- 起栈点世界地图「英语」节点 → `/english` 正常渲染 + 顶部 HUD；场景闯关 / 字母 / 音标三页可切。
- `/english-demo` 访问跳 `/english`。

## 实际改动文件
- `app/(game)/english/page.tsx`
- `app/(game)/world/page.tsx`
- `app/english-demo/page.tsx`
- `lib/utils.ts`
- `tests/english/wiring.test.ts`
