# Key screens design QA

- Source of truth: `public/design/ui-key-screens-v2.png`
- Deployment: `http://localhost`, image `hlc2012/mlk:20260719-143937`
- Acceptance state: explicit `?visual=1` fixture; login uses its normal route. The fixture is client-only and does not write Prisma or bypass server authorization.
- Viewports: 01 390×844; 02 1024×768; 03 1440×900; 04–06 768×1024; 07 1180×820.
- Runtime captures: `/tmp/01-login-visual.png` through `/tmp/07-shop-visual.png`.
- Full comparisons: `/tmp/compare-01-login.jpg` through `/tmp/compare-07-shop.jpg`.
- Focus surfaces reviewed: login logo/fairy/form, child title/cards, world island spacing, English word/quiz cards, story reader, shop products/history.

## Comparison history

- Iteration 1: P2 — login composition too low, world story/history islands overlapped, story pagination showed 1/2.
- Fixes: moved the login composition upward and resized the fairy, separated story/history islands, supplied eight story pages and opened at 2/8.
- Iteration 2: no P0/P1/P2 differences. Remaining P3 differences are viewport framing, browser font antialiasing, and the authenticated HUD.

## Fidelity surfaces

- Typography: hierarchy, weights, labels, progress and numeric treatment match the reference intent.
- Spacing: all primary containers, four-column cards, island groups and actions are visible without overlap or clipping.
- Colors: sky/kingdom background, warm paper panels, pink/blue CTAs and gold outlines are consistent.
- Image quality: dedicated transparent character, English, title and shop artwork is used; no emoji or placeholder is used as primary content art.
- Copy: reference labels, progress, stars, inventory and redemption history are present in the acceptance state.

## Functional evidence

- All seven routes returned 200 with no console errors or warnings.
- English card → apple question → correct feedback passed.
- Story next-page interaction passed (2/8 → 3/8).
- Contract test: 7/7 passed.
- Related Playwright regression: 18/18 passed, including desktop island non-overlap.
- `npx tsc --noEmit`: passed.
- `npm run build`: passed.

final result: passed

---

# 汉字内部页修正 Design QA（2026-07-25）

- Source visual truth: `public/design/hanzi-redesign-2026-07-23/pinyin-learning.png` 与同目录汉字学习视觉体系。
- Implementation evidence: `/tmp/hanzi-yuan-before.png`、`/tmp/hanzi-yuan-after.png`、`/tmp/hanzi-writing-thin-brush.png`、`/tmp/hanzi-ui-audit-2026-07-25/`。
- Viewport: 390×844 CSS px，deviceScaleFactor 1；另复测 1440×1000 桌面端。
- State: 整体认读 `yuan`/`ying`、单字书写、认字及书写完成/空状态。

## Comparison history

- Iteration 1: P1 `yuan` 主卡内容宽度 140px、容器宽度 100px；P2 手写画笔 16px 偏粗；P2 完成态和空状态未使用汉字学习壳层。
- Fixes: 长拼音使用紧凑字号，画笔调整为 10px，认字和两种书写的内部状态统一为蓝色标题、奶油卡片、金色描边与语义主按钮。
- Iteration 2: `yuan`、`ying` 内容宽度与容器宽度均为 100px；实写笔画清晰；移动和桌面截图无 P0/P1/P2。

字体层级、布局节奏、色彩语义、现有高清背景素材和真实学习文案均已复核。关键细节在上述局部截图中清晰可读，无需额外裁切。

final result: passed

---

# 汉字学习全流程重设计 Design QA（2026-07-25）

- Source visual truth: `public/design/hanzi-redesign-2026-07-23/*.png`，包含首页、课程目录、拼音、成语和新增逐字学习稿。
- Runtime captures: `/tmp/hanzi-ui-audit-2026-07-25/`，14 个状态各含 390×844 移动端与 1440×1000 桌面端截图。
- Direct comparisons: `compare-home.png`、`compare-curriculum.png`、`compare-pinyin.png`、`compare-idiom.png`、`compare-character.png`。
- Local deployment: `http://localhost`，镜像 `hlc2012/mlk:20260725-110610`。

## Comparison history

- Iteration 1: P1 全局引导气泡遮挡学习操作；P1 桌面首页沿用移动卡片宽度导致任务卡重叠；P2 逐字学习移动首屏信息密度偏低。
- Fixes: 移除首页重复入场气泡，保留反馈引导；约束桌面首页任务区和入口宽度；压缩逐字学习字卡、提示、词语、例句和操作栏。
- Iteration 2: 无 P0/P1/P2。移动端与桌面端所有主操作可见、可滚动且无内容重叠；仙女仅保留在安全边角。

## Fidelity and functional evidence

- 五张实现对照稿保持天空/王国背景、奶油纸张、金色描边、珊瑚红主按钮、蓝色学习控制和紫色成语语义。
- 首页、课程目录、逐字学习、认字闯关、单字书写、词语书写、故事识字、拼音基础/小测、成语三状态、学习记录/组词库均完成浏览器验证。
- 所有素材均来自项目现有高清资产或本次批准的生成稿；未把效果图整张作为交互页面。
- 28 张最终截图的浏览器 `pageerror` 与 console error 均为 0。
- 汉字结构测试 27/27；TypeScript 通过；Next.js production build 通过。

final result: passed

---

# 汉字探险岛重设计 Design QA（2026-07-23）

- Source visual truth: `public/design/hanzi-redesign-2026-07-23/*.png`（四张 853×1844，归一化为 390×844）。
- Implementation screenshots: `tmp/hanzi-redesign-qa/home-mobile.png`、`curriculum-mobile.png`、`pinyin-mobile.png`、`idiom-mobile.png`、`home-desktop.png`。
- Combined comparisons: `tmp/hanzi-redesign-qa/compare-home.png`、`compare-curriculum.png`、`compare-pinyin.png`、`compare-idiom.png`。
- Viewport/density: mobile 390×844 CSS px、deviceScaleFactor 1；desktop 1280×800 CSS px。比较图将源稿等比归一化到 390×844。
- State: 首页今日任务；启蒙识字第一单元且全选；拼音声母 b 与四声；成语“画龙点睛”读成语页。

## Comparison history

- Iteration 1: P1 首页缺少场景背景；P2 拼音默认状态与源稿不一致；P2 移动目录缺少章节行。
- Fixes: 使用现有王国移动/桌面背景；拼音默认进入声母并展示 b 的四声拼读；在阶段标签下补充真实单元章节和进度行。
- Iteration 2: 无可执行的 P0/P1/P2。源稿里的示例儿童名、星数和课程词条由当前登录儿童、真实进度与真实课程数据替代，属于产品约束。

## Required fidelity surfaces

- Typography: 标题、课程名、字卡、拼音与辅助文案的字号/字重层级与源稿一致；系统中文字体的字形差异为可接受 P3。
- Spacing/layout: 四个页面均使用 390×844 单屏工作区；主要操作不被页面级滚动隐藏；目录和长字母表仅在内容区域内滚动。
- Colors/tokens: 珊瑚红、天空蓝、奶油纸张、紫色成语和金色描边与源稿一致。
- Image quality: 首页使用现有高清王国背景和学科岛切图；未使用效果图整图作为交互界面。
- Copy/content: 保留真实章节、汉字、拼音、成语、进度、语音和练习文案；所有主操作可用。

## Functional evidence

- 全选/清空、阶段和章节切换、拼音声母、四声按钮、成语目录、读成语/听典故/做小测均已浏览器验证。
- 浏览器 `pageerror` 与 console error：0。
- 汉字域测试：78/78；TypeScript：通过；Next.js production build：通过。
- Local deployment: `http://localhost`，镜像 `hlc2012/mlk:20260723-005745`，容器 healthy。

Focused region comparison was not separately required because normalized 390×844 combined captures keep all typography, controls, and card detail readable.

final result: passed
