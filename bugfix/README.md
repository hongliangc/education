# Bugfix Records

局部缺陷只使用本目录轻量留痕，不额外创建 spec、plan 或任务状态文档。

收到 bug 请求后，在诊断和修改代码前创建：

```text
bugfix/YYYY-MM-DD-<slug>.md
```

最小模板：

```markdown
# <标题>

- id: `YYYY-MM-DD-<slug>`
- status: investigating
- commit: pending

## 现象与复现
- <用户看到的现象>
- <最小复现步骤或输入>

## 根因
- investigating

## 修复
- pending

## 回归测试
- pending

## 验证
- pending
```

状态按 `investigating -> fixing -> verified -> done` 更新。一个记录对应一个
最终 commit，提交信息包含 `[bugfix:<id>]`。完成时将 `commit` 改为
`this commit`；实际 SHA 使用 `git log -- bugfix/<file>` 查询。
