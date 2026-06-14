# 数学模块按教学内容细分（算术四档分类）设计

→ 正文在 wiki：`[[projects/mlk/specs/2026-06-14-math-content-categories-design]]`
→ 绝对路径：`E:\workspace\knowledge-wiki\wiki\projects\mlk\specs\2026-06-14-math-content-categories-design.md`

数学模块内部增加「按教学内容」细分：算术四档（10以内加减 / 20以内进退位 / 表内乘法 / 表内除法）。每档复用 math-demo 互动动画当教学演示、约束生成器保证每题可动画、按分类过滤错题本。新增 `MathCategories` hub + `content/math/categories.ts` 分类表 + `tableMultiply/tableDivide` 两个生成器；纯前端，不动 schema/API/部署文件。
