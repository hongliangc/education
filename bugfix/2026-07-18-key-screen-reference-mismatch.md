# 关键页面与 UI 参考图不一致

- id: `2026-07-18-key-screen-reference-mismatch`
- status: blocked
- commit: pending

## 现象与复现
- 当前网站的关键页面在构图、插画资源、导航和组件外观上与 `public/design/ui-key-screens-v2.png` 不一致。
- 本地部署后依次访问登录、儿童选择、世界地图、英语、故事和商店页面，对照参考图 01–07。

## 根因
- `public/design/ui-key-screens-v2.png` 是概念总览图，运行时代码没有引用；`ui-asset-master-v1.png` 也不是可直接消费的切图目录。
- 当前只生成并使用了世界背景、岛屿、影院、商店和精灵等部分资源，缺少登录 Logo、儿童插画头像、故事主插画等关键资源。
- 登录、儿童选择、英语、故事和商店页面沿用通用背景、emoji 与白色卡片，未按 01–07 屏的层级、面板和图像占比实现。
- 原有自动化只检查可用性、溢出和语义，没有对关键设计资源与页面结构建立回归契约。

## 修复
- 补齐关键位图资源，并让登录、儿童选择、世界地图、英语、故事和商店复用统一纸张面板、糖果按钮和插画层级。
- 增加关键屏幕设计契约与同视口截图对照。

## 回归测试
- `node --experimental-strip-types --test tests/ui/key-screen-reference.test.ts`：4/4 通过。
- 新增登录品牌、儿童头像、故事插画和关键页面纸张面板的资源契约。

## 验证
- `npx tsc --noEmit`：通过。
- `npm run build`：通过。
- `bash scripts/release.sh local`：连续三次在 Docker 构建内下载 Prisma engine 时发生 TLS 断连；宿主机直连该地址返回 200。改用宿主网络后 Prisma 问题消失，但 `npm ci` 超过 5 分钟无进展，已停止，未替换当前健康容器。
