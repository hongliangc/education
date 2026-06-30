# 写字练习演示描边干扰练习

- id: `2026-06-30-hanzi-writing-demo-interferes`
- status: verified
- commit: pending

## 现象与复现
- 写字练习进入单字后会先演示描边，但孩子开始练习时仍然会持续描边，干扰手写。
- 希望自动演示只发生一次；之后进入练习。需要在“听这个字”旁边增加“演示书写方式”按钮，用户主动查看演示。
- 演示结束后仍需要保留字形轮廓，方便孩子临摹；只停止笔顺演示本身。
- 临摹完成后再次点“演示笔顺”，演示笔画被孩子书写的 canvas 笔迹遮挡。
- 需要固定三层 Z 轴：字形轮廓在 0，孩子笔迹在 1，笔顺演示在 2。
- 需要提供“清理”和“回撤”按钮，分别清空全部笔迹和撤回上一次笔画。
- 临摹写上的笔画会在抬笔或重渲染后自动消失。

## 根因
- `HanziWriterPad` 自动执行 `animateCharacter()` 后直接进入 `quiz()`，没有显式结束演示样字状态。
- Hanzi Writer 的 `quiz()` 本身不是自由临摹模式：写对一笔会 `showStroke()` 显示笔画，写错后还可能按 `showHintAfterMisses` 自动高亮提示，视觉上像“下笔后又自动播放笔顺演示”。
- 单个 Hanzi Writer 容器无法同时满足“静态轮廓在底层”和“演示动画在顶层”；自由书写 canvas 也需要独立笔画状态才能支持撤回。
- 之前用 React state 保存笔画数组并由 effect 重绘 canvas，抬笔后父组件更新计数会触发重渲染，存在重绘时机把即时笔迹清空的风险。
- 组件也没有暴露手动演示入口，用户只能承受进入练习时遗留的描边提示。

## 修复
- 抽出 `runDemoThenPractice()`：取消当前 quiz，显示轮廓，播放一次笔顺动画，隐藏实心样字，保留临摹轮廓；不再启动 Hanzi Writer quiz。
- `HanziWriterPad` 增加自由书写 canvas 覆盖层，由孩子自己临摹书写，不触发 Hanzi Writer 的自动提示/显笔动画。
- 拆成三个独立图层：outline Hanzi Writer 为 `z-0`，自由书写 canvas 为 `z-10`，demo Hanzi Writer 为 `z-20 pointer-events-none`。
- 自由书写 canvas 改为笔画数组状态；新增“清理”清空全部笔画，“回撤”删除上一笔并重绘。
- 笔画历史改由 `useRef` 作为单一数据源保存；React state 只保存笔画数量用于按钮禁用状态。抬笔、清理、回撤都直接按 ref 立即重绘 canvas，避免重渲染导致笔迹丢失。
- `HanziWriterPad` 默认不显示 outline；自动演示和手动演示都复用同一流程。
- 在“听这个字”旁新增“演示笔顺”按钮，用户可按需再次观看演示。

## 回归测试
- 新增 `tests/hanzi/writer-flow.test.ts`，验证演示流程顺序为 `cancelQuiz -> showOutline -> animateCharacter -> hideCharacter`，不调用 `hideOutline`，也不启动 `quiz`。

## 验证
- `node --experimental-strip-types --test tests/hanzi/writer-flow.test.ts`
- `node --experimental-strip-types --test tests/hanzi/catalog.test.ts`
- `npx tsc --noEmit`
- `npm run build`
