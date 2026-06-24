# 手机影院模式布局与播放器控件混乱

- id: `2026-06-22-mobile-cinema-player-layout`
- status: done
- commit: this commit

## 现象与复现
- 手机上进入影院模式后，页面布局和排版混乱。
- 打开视频时，播放器上方按钮过多；期望参考腾讯视频，常态控件精简，全屏时自动横屏，全屏触碰后再显示更多设置按钮，闲置自动隐藏。
- 现网 iPhone 点击全屏会进入 iOS 原生托管播放器，不是站内横屏播放器。
- 现网影院下方视频行在手机上仍然过宽，底部列表排版显得拥挤混乱。

## 根因
- 手机影院页把返回、标题、搜索和主题切换都放进同一个可换行 sticky 顶栏，返回按钮沿用桌面尺寸，窄屏首屏容易挤压。
- 手机播放器底栏一次性展示播放、下一集、快退、快进、音量、倍速、清晰度、选集、锁屏、全屏等按钮，窄屏会换行堆叠，破坏沉浸式视频体验。
- iPhone 分支调用了 `<video>.webkitEnterFullscreen()`，这会强制切到 iOS 原生播放器，站内控件和自动隐藏逻辑都无法继续控制。
- 移动端横向视频卡宽度为 `68vw`，iPhone 上一屏只能显示 1 个多卡片，不符合视频 App 的双卡横滑密度。

## 修复
- 手机影院页改为更紧凑的两层顶栏：第一层返回与标题，第二层搜索；主题切换保留在平板/桌面。
- 缩小手机端 hero、列表标题、海报卡和间距，横向视频行隐藏桌面滚动箭头，减少首屏混乱。
- 手机播放器常态只保留核心控件；全屏后触碰播放器显示高级控件行，包含快退/快进、音量、倍速、清晰度、选集、锁屏；停止触碰后沿用自动隐藏逻辑。
- 保留 Fullscreen API 可用设备的元素全屏和横屏锁定；iPhone Safari 改为站内横屏沉浸模式，不再调用 `webkitEnterFullscreen()`。
- 移动端横向视频卡从 `68vw` 调整为 `44vw`，列表标题与卡片文案同步压缩，接近视频 App 双卡横滑布局。

## 回归测试
- `npx tsc --noEmit`
- `npm run build`

## 验证
- `npx tsc --noEmit` 通过。
- `npm run build` 通过。
- Playwright 移动端截图尝试受现有 `/theater` 首轮 child hydration 重定向影响，假 child 已写入 localStorage 但页面仍跳转 `/child-select`；未纳入本次布局修复范围。

## 真机复盘（2026-06-22 二轮）

上一轮只跑了 tsc/build，没真机验证。iPhone 真机实测仍有两点未达预期：

1. 点全屏后横屏了但左右仍有黑边，不像全屏。
   - 根因：`<video>` 是 `object-contain`，等比适应；16:9 片源放进手机横屏视口（≈19.5:9）必然左右信箱留黑。这是"保持比例"的正确行为，但观感上不够沉浸。
   - 修复：新增"铺满 / 适应"切换（默认仍适应保留比例，全屏时可一键 `object-cover` 放大裁切填满），与腾讯视频一致。仅在触屏设备全屏态的高级控件行显示该按钮；退出全屏自动回到适应，避免常态被裁切且无法切回。
2. 横屏观看时按钮又变多。
   - 根因：控件密度用 Tailwind `sm:`（视口宽度 ≥640px）区分桌面 / 移动；而 iPhone 横屏宽度（844~932px）必然 > 640px，一横屏就触发 `sm:`，把后退/前进/音量/倍速/清晰度/选集/锁屏全量桌面按钮放出来。
   - 修复：改用 `useCoarsePointer()`（`(pointer: coarse)`，跟随输入方式而非宽度）判定紧凑模式。触屏设备无论横竖屏都保持两层精简布局：常态只留核心控件，全屏触碰才在第二行展开高级控件，闲置自动隐藏不变。桌面设备继续保留完整底栏控件。

涉及文件：`components/video/icons.tsx`（新增 AspectFit/AspectFill 图标）、`components/video/useCoarsePointer.ts`（新增）、`components/video/VideoControls.tsx`、`components/video/VideoPlayer.tsx`。

## 三轮：PWA 真全屏 + 腾讯式控件 + 手势（预览版，2026-06-23）

用户真机（iPhone Safari）反馈：伪全屏顶部仍有 Safari 地址栏/状态栏，不是真全屏；并给出腾讯视频 App 截图作为排版与交互参考（全屏两行控件、手势快进、长按倍速、选集等）。

### 关键结论（平台硬限制）
- iPhone Safari **标签页内网页无法真全屏**（无元素 Fullscreen API，地址栏/状态栏去不掉），旋转大法只能做伪全屏。原生 `webkitEnterFullscreen` 能真全屏但会丢掉全部自定义控件（下一集/选集/手势），与用户需求冲突。
- 网页要“真全屏 + 全套自定义控件”，iPhone 上唯一路径是 **PWA standalone**（添加到主屏幕后从图标启动，无 Safari chrome，旋转全屏即真全屏）。已与用户确认走 PWA。
- iOS Web 限制：JS 改不了媒体音量（音量手势在 iPhone 仅显示不生效）、摸不到系统亮度（亮度手势用 CSS `filter: brightness()` 模拟）。

### 本轮改动（预览版）
- PWA：新增 `app/manifest.ts`、`public/icon.svg`，`app/layout.tsx` 增加 `appleWebApp`(capable + black-translucent) 与 manifest/icons。加到主屏幕后伪全屏即真全屏，控件全保留。
- 控件排版参考腾讯：手机竖屏内联单行精简（播放·时间·进度·时间·全屏）；全屏/桌面两行（上=整条进度 + 两端时间，下=左 播放/下一集 右 倍速/清晰度/选集/铺满/全屏）；锁屏移到左侧中部；暂停时中央大播放键。
- 手势层：新增 `useVideoGestures.ts` + `GestureLayer.tsx`，覆盖在视频上、控件下。横向拖动快进/快退（松手提交+居中预览）、左半区竖滑亮度、右半区竖滑音量、长按 2× 临时倍速、单击切换控件/双击播放暂停（鼠标单击=播放暂停）。
- `VideoPlayer` 接入：新增 brightness / tempRate 状态（长按倍速优先于选定倍速），视频套 `filter: brightness()`，去掉 video 原 onClick 改由手势层统一处理。

涉及文件（本轮）：`app/manifest.ts`(新增)、`public/icon.svg`(新增)、`app/layout.tsx`、`components/video/useVideoGestures.ts`(新增)、`components/video/GestureLayer.tsx`(新增)、`components/video/VideoControls.tsx`、`components/video/VideoPlayer.tsx`。

### 验证（本轮）
- `npx tsc --noEmit` 通过。
- `npm run build` 通过（`/manifest.webmanifest` 已生成为静态路由）。
- `tests/video/mobile-player-controls.test.ts` 2/2 通过（其余 `@/` 别名测试因本 worktree 缺 tsx loader 无法本地跑，与本次改动无关）。
- 真全屏 / 手势效果需 iPhone 真机验证：现网 HTTPS 打开 → 分享 → 添加到主屏幕 → 从图标进入 → 播放 → 全屏。

二轮补充：
- 补齐 Claude 上一轮未接完的实现：`VideoControls` 现在实际使用 `useCoarsePointer()`，不再用 `hidden sm:flex` / `sm:hidden` 决定触屏控件密度。
- 补齐 `onToggleFill` 控件渲染：触屏全屏高级行展示"铺满屏幕 / 适应屏幕"按钮。
- `VideoPlayer` 在退出全屏时重置 `filled=false`，避免下一次进入全屏沿用裁切状态。
- 新增 `tests/video/mobile-player-controls.test.ts` 锁住这两个回归点。

二轮验证：
- `node --experimental-strip-types --test tests/video/mobile-player-controls.test.ts` 通过。
- `npx tsc --noEmit` 通过。
- `npm run build` 通过。Next.js 仅提示 worktree 中存在额外 `package-lock.json` 导致 workspace root 推断警告，构建成功。

## 四轮：现网真机「旋转横屏但上下没填满」+ 真全屏 meta 缺失（2026-06-23）

用户现网部署后真机反馈：点全屏后播放器旋转横屏，但手机上下两侧没填满。

### 根因
1. `.video-player-landscape` 旋转大法用的是 `dvh`/`dvw`（动态视口，会扣掉 Safari 地址栏/状态栏高度）。旋转 90° 后这块「动态高度」变成了视觉宽度方向之外的短边，导致旋转后的视频块短于物理屏，上下（旋转前的左右）填不满。
2. 真全屏唯一路径是 PWA standalone，但现网 head 里**只有** `mobile-web-app-capable`，缺旧版 `apple-mobile-web-app-capable`——Next 16 的 `appleWebApp.capable` 不再输出旧标签。iOS <16.4「添加到主屏幕」靠旧标签判定 standalone，缺它则仍带 Safari chrome，真全屏失效。

### 修复
- `app/globals.css`：`.video-player-landscape` 的 `dvh`/`dvw` 改为 `vh`/`vw`（完整布局视口=整块物理屏）。standalone 下 `vh` 即真全屏铺满；Safari 标签页下也铺满物理屏，工具栏浮在边缘。
- `app/layout.tsx`：`metadata` 增加 `other: { "apple-mobile-web-app-capable": "yes" }`，手动补回旧 iOS 识别的 standalone 标签。

### 四轮验证
- `npx tsc --noEmit` 通过。
- `npm run build` 通过（仅 workspace root 推断警告）。
- 构建产物 `login.html` 的 `<head>` 已同时含 `apple-mobile-web-app-capable` 与 `mobile-web-app-capable`（content="yes"）。
- 真机效果（旋转铺满 + 主屏图标真全屏）需现网重新部署后 iPhone 验证；建议「添加到主屏幕→从图标进入」走 standalone 真全屏。

### 四轮复盘：用户仍在 Safari 标签页里测，真全屏路径没走对
- 用户新截图（21:30）顶部 `119.91.153.49` 地址栏 + 底部 Safari 工具栏俱在 → 是**标签页**，非 standalone。标签页内网页无法去掉这两条 Safari 栏，这正是「上下没填满」。现网 `<head>` 已确认带 `apple-mobile-web-app-capable: yes`，真全屏路径已就绪，只是用户没从主屏幕图标进入。
- 平台事实复述（回答用户「腾讯怎么做的」）：PC/安卓用容器级 Fullscreen API（真全屏 + 自定义控件全保留）；iPhone Safari 无元素全屏 API，只能 `webkitEnterFullscreen` 交给原生播放器（丢自定义控件）。腾讯那套丰富自定义全屏是**原生 App**，不是 iPhone Safari 网页能力。结论：iPhone 网页要「真全屏 + 全部自定义控件」唯一路径是 PWA standalone。
- 用户拍板：要「真全屏 + 保留全部自定义控件」→ 即 standalone 路径（代码已支持）。缺口是用户/终端不知道要「添加到主屏幕」，直接在 Safari 点全屏就掉进带栏伪全屏。

### 五轮（已废弃）：添加到主屏幕引导
- 一度新增 `useAddToHomeHint.ts` + `AddToHomeHint.tsx`，在标签页点全屏时引导添加到主屏幕。
- 六轮改混合全屏后，标签页直接走原生真全屏、不再进伪全屏（`isFullscreen` 不置 true），该引导触发条件永不命中 → 已删除两个文件并回退 VideoPlayer 的 3 处接入。

### 六轮：混合全屏（标签页原生真全屏 + standalone 自定义全屏）
现网验证：CSS `width:100vh;height:100vw`、`apple-mobile-web-app-capable:yes`、manifest `display:standalone` 均已上线，standalone 路径技术就绪。但用户连续多张截图都在 Safari 标签页（底部 `119.91.153.49` 地址栏 + 工具栏），标签页内 Safari 上下栏无法去除，伪全屏永远填不满；让每个用户「添加到主屏幕」对儿童应用是过重的负担。

最终方案改为按运行环境三分支（`useLandscapeFullscreen`）：
- 桌面 / 安卓 / iPad：元素 `requestFullscreen()` + 锁横屏，自定义控件随容器全屏（不变）。
- **iPhone Safari 标签页**：调用原生 `video.webkitEnterFullscreen()`，交给 iOS 系统播放器拿**真全屏**（立刻铺满无栏、零设置）；全屏内为原生控件，选集/手势留在页面。`webkitEnterFullscreen` 偶发不可用时退回站内旋转伪全屏。
- **iPhone standalone**（从主屏幕图标启动）：仍走站内 CSS 旋转全屏，真全屏 + 保留全部自定义控件。

要点：标签页内本就无法在全屏显示自定义 HTML 控件（平台硬限制），故原生全屏没有真正损失；用户「真全屏 + 全控件」的诉求由 standalone 路径继续满足，标签页则从「带栏伪全屏」升级为「原生真全屏」。

涉及文件（本轮）：`components/video/useLandscapeFullscreen.ts`（标签页分支改原生全屏 + standalone 检测）。

### 六轮验证
- `npx tsc --noEmit` 通过。
- `npm run build` 通过（仅 workspace root 推断警告）。
- `node --test tests/video/mobile-player-controls.test.ts` 2/2 通过。
- iPhone 真机：现网重新部署后，Safari 标签页内点全屏应直接进入 iOS 原生全屏播放器、铺满无栏；standalone（主屏幕图标）下点全屏为站内旋转全屏 + 全部自定义控件。

### 七轮：定稿——全屏走 iOS 原生，内联用自定义按钮，手势全删（2026-06-24）

用户最终拍板：「全屏就使用 iOS 自带原生全屏，非全屏支持自定义的按钮，包括：播放/暂停、下一集、选集」，并明确「当前手势效果不好，准备去掉」。据此把前几轮堆叠的 standalone 旋转伪全屏、手势层、亮度/临时倍速等实验性能力全部移除，回到平台能力边界内最稳的两条路径。

#### 定稿方案
- 全屏：桌面 / 安卓 / iPad 仍走容器 `requestFullscreen()` + 锁横屏（自定义控件随容器全屏）；iPhone Safari 一律 `video.webkitEnterFullscreen()` 交给 iOS 系统播放器拿真全屏。删除 standalone 检测与站内 CSS 旋转伪全屏分支——标签页内本就无法叠加自定义 HTML 控件，原生全屏没有真正损失，也不再要求用户「添加到主屏幕」这种对儿童应用过重的前置操作。
- 非全屏（内联）：自定义按钮保持齐全——播放/暂停、下一集、选集（`EpisodeMenu`）、进度、时间、倍速、清晰度、全屏键，均由 `VideoControls` 在 `useCoarsePointer()` 紧凑布局下提供。全屏的「铺满/适应」切换保留。
- 手势：删除 `useVideoGestures.ts` + `GestureLayer.tsx`，画面单击改为一个透明按钮（`toggleControls`，覆盖在视频上、控件下），不再有拖动快进/竖滑亮度音量/长按倍速。`VideoPlayer` 同步移除 `brightness` / `tempRate` 状态、`filter: brightness()` 内联样式，播放速度副作用简化为只依赖 `rate` / `activeSrc`。
- 原生全屏进出由 iOS 控制，`useLandscapeFullscreen` 监听 `webkitbeginfullscreen` / `webkitendfullscreen` 把 `isFullscreen` 镜像回来，保持控件状态一致。

涉及文件（本轮）：`components/video/useLandscapeFullscreen.ts`（收敛为两路径 + 原生全屏事件）、`components/video/VideoPlayer.tsx`（去手势/亮度/临时倍速，加点击切换面层，去 `video-player-landscape`）、`app/globals.css`（删 `.video-player-landscape` 旋转块）、删除 `components/video/useVideoGestures.ts`、`components/video/GestureLayer.tsx`。

#### 七轮验证
- `npx tsc --noEmit` 通过。
- `npm run build` 通过（仅 workspace root 推断警告）。
- `node --experimental-strip-types --test tests/video/mobile-player-controls.test.ts` 2/2 通过。
- iPhone 真机：Safari 标签页内点全屏直接进 iOS 原生全屏播放器、铺满无栏；内联态下播放/暂停、下一集、选集等自定义按钮齐全可用。

### 八轮：定稿两处回归（2026-06-24）

七轮定稿后用户真机两点反馈：①非全屏看不到自定义控件按钮；②未播放时点全屏没反应，必须先点播放才能全屏，且自定义按钮闪现一下才切到全屏。

#### 根因
1. **非全屏缺按钮**：`VideoControls` 的 `compact && !isFullscreen` 单行精简分支只渲染 播放·时间·进度·时间·全屏，**漏掉了下一集与选集**（与七轮「非全屏要有播放/暂停、下一集、选集」的要求冲突）。
2. **未播放点全屏无效**：iOS 用 **native HLS**（`useHlsVideo` 命中 `canPlayType('application/vnd.apple.mpegurl')`，直接 `video.src=m3u8`）。iOS 在首次用户手势播放前不加载元数据，`webkitSupportsFullscreen` 为 false、`webkitEnterFullscreen()` 静默无效；点播放加载元数据后才可全屏。「按钮闪现」是第一下播放让控件短暂显示、第二下才进全屏。

#### 修复
1. `VideoControls`：删掉 `compact && !isFullscreen` 单行分支，手机非全屏改走两行布局——底行含 播放/暂停、下一集、倍速、清晰度、选集、全屏（紧凑模式仍隐藏快退/快进/音量）。
2. `useLandscapeFullscreen` 的 iPhone 分支：`webkitSupportsFullscreen` 为真时直接进原生全屏；否则在**同一用户手势**内 `video.play()` 触发元数据加载，监听一次 `loadedmetadata` 后再 `webkitEnterFullscreen()`，做到「未播放也能一下点全屏」。

涉及文件（本轮）：`components/video/VideoControls.tsx`、`components/video/useLandscapeFullscreen.ts`。

#### 八轮验证
- `npx tsc --noEmit` 通过。
- `npm run build` 通过（仅 workspace root 推断警告）。
- `node --experimental-strip-types --test tests/video/mobile-player-controls.test.ts` 2/2 通过。
- 注：当前测试仅做源码字符串断言、无 DOM 渲染，bug1 的按钮可见性与 bug2 的 iOS 原生全屏需 iPhone 真机确认：非全屏底栏应见下一集/选集；未播放点全屏应一下进 iOS 原生全屏。

### 九轮：按职责拆分 VideoPlayer（2026-06-24）

真机确认上述修复后，按 250 行硬规则把 `VideoPlayer.tsx`（331 行）拆分，行为不变：
- `useVideoSource.ts`：rendition/清晰度解析 + 续播 ref（pendingResume/resumePlaying）。
- `useVideoCommands.ts`：命令式媒体操作（播放/暂停、快进退、跳转、音量、静音）。
- `useControlsVisibility.ts`：控件浮层显隐与 3 秒自动隐藏。
- `VideoStatusOverlay.tsx`：加载/出错/未选片提示浮层。
- `VideoLockButton.tsx`：锁屏开关（合并原先重复的上锁/解锁两个按钮）。

`VideoPlayer.tsx` 收敛为「组合各 hook + 渲染」共 223 行（<250）。验证：`npx tsc --noEmit`、`npm run build`、`node --experimental-strip-types --test tests/video/mobile-player-controls.test.ts`(2/2) 全过。

### 遗留
- 无。
