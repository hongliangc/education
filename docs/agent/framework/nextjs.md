# Next.js 16 Entry

本项目的 Next.js 版本包含训练数据之后的 breaking changes。修改页面、布局、Route Handler、缓存、Server Action 或构建配置前：

1. 在 `node_modules/next/dist/docs/` 搜索当前 API。
2. 阅读与任务直接相关的页面。
3. 遵守文档中的 deprecated/removal 提示。
4. 再检查仓库内现有实现模式。

常用代码位置：

- 页面和布局：`app/`
- API Route Handlers：`app/api/**/route.ts`
- 认证：`auth.ts`、`app/api/auth/`
- Next 配置：`next.config.ts`
- 全局样式：`app/globals.css`

不要依赖记忆中的旧 Next.js API。
