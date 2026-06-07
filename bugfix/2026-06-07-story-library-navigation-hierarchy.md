# 故事书架导航与标题层级缺失

- id: `2026-06-07-story-library-navigation-hierarchy`
- status: done
- commit: this commit

## 现象与复现
- `/story` 标题区没有返回世界入口，用户进入故事书架后无法从页面主体直接回到世界。
- `长篇故事` 与 `短篇绘本` 使用 `text-sm`，视觉层级不足，不能清晰区分二级内容分区。

## 根因
- 故事书架页面最初只在标题区渲染主标题，没有提供返回世界的页面级导航控件。
- 两个内容分区从初始实现起沿用了辅助文字尺寸 `text-sm`，未建立主标题之下的清晰二级标题层级。

## 修复
- 在故事书架标题区增加可见的 `← 返回世界` 按钮；点击时先调用 `sfx.click()`，再调用 `router.push("/world")`。
- 将 `长篇故事` 与 `短篇绘本` 改为语义化 `h2`，并使用 `text-xl font-bold` 建立清晰的二级标题层级。

## 回归测试
- 新增 `tests/story/library-navigation.test.ts` source contract 测试，约束返回控件必须导航到 `/world`，且两个分区标题都至少使用 `text-xl` 和 `font-bold`。
- RED：`node --test tests/story/library-navigation.test.ts` 失败；直接运行测试文件确认两个断言分别因返回控件缺失和标题仍为 `text-sm` 失败。
- GREEN：实现修复后，`node --test tests/story/library-navigation.test.ts` 通过。

## 验证
- `node --test tests/story/library-navigation.test.ts`
- `npx tsc --noEmit`
