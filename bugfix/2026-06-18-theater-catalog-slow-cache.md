# 视频影院加载慢：目录冷构建阻塞 + 缓存无续期/不持久

- id: `2026-06-18-theater-catalog-slow-cache`
- status: done
- commit: this commit

## 现象与复现
- 进入「视频影院」首屏要等好久才出目录；容器/服务重启后第一次更明显。

## 根因
- 目录构建 `loadCatalog()`（`lib/video/catalog.ts:108`）：1 次 root list + N 个分类文件夹各一次 list，全部打远程 OpenList→阿里云盘，限流并发 4；945 条视频跨多文件夹 → 冷构建数秒。
- 现有缓存（`cachedCatalog`，TTL `OPENLIST_CATALOG_TTL_SEC||600`）是**进程内、重启即丢、且无 stale-while-revalidate**：冷启动或每 10 分钟过期时，触发的那个用户要 `await` 整次重建。
- 海报另走 `refresh:true` 每文件夹实时 re-list（`folderThumbCache` TTL 180s），叠加等待。
- 结论：不是「没缓存」，是冷启动/过期会阻塞 + 缓存不跨重启。

## 修复（用户选「SWR + 预热 + 跨重启持久化」）
1. **持久化**：新增 Prisma 模型
   ```prisma
   model VideoCatalogCache {
     id        String   @id @default("default")
     payload   String   // JSON 序列化 OpenListVideoEntry[]；用 String 规避 SQLite/PG Json 差异（同 WeeklyReport.summaryJson）
     updatedAt DateTime @updatedAt
   }
   ```
   `loadCatalog()` 成功后 `upsert`。
2. **冷启动 seed**：`getCatalogEntries()` 内存为空时先读 DB 行 seed 内存缓存（首请求秒回，不打 OpenList）。
3. **SWR**：缓存存在但过期 → **立即返回旧条目**并后台触发 `loadCatalog()`（`catalogPromise` 去重）；仅当完全无缓存（内存 + DB 都无）时才 `await`。
4. **预热（可选，最后做以降风险）**：新增 `instrumentation.ts` 的 `register()` 启动调一次 `getVideoCatalog()` 预热。改 Next 代码前先读 `node_modules/next/dist/docs/` 的 instrumentation 指南。
- 海报 TTL/刷新策略本次不动。

## 回归测试
- 给 catalog SWR 分支加单测：mock `loadCatalog` 慢 → 断言过期时**立即返回旧值**且后台刷新；DB 有行时冷启动**不调** OpenList。

## 验证
- `node --test tests/english/wiring.test.ts tests/fairy/chat-speech.test.ts tests/video/catalog-cache.test.ts` 通过。
- `npm run db:push` 通过，Prisma Client 已重新生成。
- `npx tsc --noEmit` 通过。
- `npm run build` 通过。
- `GET /api/videos?childId=x` 未登录返回 `401`。（`POST /api/videos?childId=x` 返回 `405`，因为该目录路由只实现 GET。）
- 本地起栈：首次进影院计时、过期后再进不卡；容器重启后首屏快。
- `/api/videos` 未登录仍 401：`curl -sI "http://localhost:3000/api/videos?childId=x" -o /dev/null -w '%{http_code}\n'`。

## 实际改动文件
- `prisma/schema.prisma`
- `lib/video/catalog.ts`
- `instrumentation.ts`
- `tests/video/catalog-cache.test.ts`
