# 汉字书写提示笔顺数据未准备

- id: `2026-07-12-hanzi-stroke-data-missing`
- status: done
- commit: this commit

## 现象与复现
- 从逐字学习点击“写一写”后，书写板提示“这个字的笔顺数据暂时没准备好”。
- 需要检查单字书写、词语书写及其他入口是否存在相同的数据覆盖问题。

## 根因
- 课程字库共有 595 个可学习汉字，但 `public/hanzi-data` 只包含 147 份本地笔顺文件。
- `HanziWriterPad` 的单字书写与词语书写都从该目录加载数据，因此其余 448 个汉字都会显示缺失提示。

## 修复
- 从已安装的 `hanzi-writer-data` 中补齐课程字库需要的 448 份笔顺文件；本地覆盖达到 595/595。
- 保持按字加载，不引入课程以外的数千份数据，新增资源约 2.4 MB（整个笔顺目录）。

## 回归测试
- `tests/hanzi/catalog.test.ts` 新增全字库笔顺文件存在性检查，新增汉字若未补数据会直接失败。

## 验证
- `node --test tests/hanzi/*.test.ts`：15/15 通过。
- `npx tsc --noEmit`：通过。
- `npm run build`：通过。
