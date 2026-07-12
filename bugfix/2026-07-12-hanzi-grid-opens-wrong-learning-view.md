# 汉字格打开了错误的学习界面

- id: `2026-07-12-hanzi-grid-opens-wrong-learning-view`
- status: verified
- commit: pending

## 现象与复现
- 在汉字学习首页点击“一、二、三”等汉字格，没有进入已确认的完整逐字学习页面。
- 实际交互仍使用旧的学习卡路径，与预览图的左侧字序、组词、例句和“写一写”布局不一致。

## 根因
- `HanziCurriculumBrowser` 的汉字格点击事件仍只更新组件内部的 `selectedItem`，打开旧学习卡。
- 新的 `HanziDailyLesson` 独立页面只连接了首页一级入口，没有接入目录汉字格，也没有接收被点击汉字作为初始位置。

## 修复
- 汉字格点击改为进入 `HanziDailyLesson` 独立逐字学习页，不再打开旧学习卡。
- 点击时传入当前单元完整汉字列表和目标汉字 ID，目标字成为初始位置，左侧保留完整字序。
- 独立页继续提供组词、例句、故事提示、朗读及“认一认 / 写一写”入口。

## 回归测试
- `tests/hanzi/home-wiring.test.ts` 覆盖汉字格到独立学习页的事件接线和初始汉字传递。

## 验证
- `node --test tests/hanzi/*.test.ts`：15/15 通过。
- `npx tsc --noEmit`：通过。
- `npm run build`：通过（沙箱外；Turbopack 沙箱内无法绑定内部端口）。
