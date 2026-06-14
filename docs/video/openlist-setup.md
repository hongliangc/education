# OpenList 阿里云盘视频源

1. 启动服务：`docker compose up -d openlist`
2. 在服务器本机打开 `http://127.0.0.1:5244`，立即修改初始管理员密码。
3. 在 OpenList 中添加 `AliyundriveOpen` 存储并完成 OAuth，挂载路径设为 `/videos`。
4. 新建普通用户 `mlk-video`，`base_path` 设为 `/videos`，权限值设为 `0`；应用不得使用管理员账号。
5. 将 `catalog.example.json` 按实际文件名修改后上传为 `/videos/catalog.json`。
6. 配置 `OPENLIST_USERNAME`、`OPENLIST_PASSWORD` 等环境变量。
7. 使用真实视频执行 `npm run videos:verify-openlist`，确认 M3U8、媒体分片和 CORS 全部通过。

`catalog.json` 中的 `id` 是奖励解锁记录的永久业务键。替换或重新上传视频时可以修改
`path`，但不得修改已有 `id`。

由于 `mlk-video` 的 `base_path` 已限制在 `/videos`，应用侧
`OPENLIST_VIDEO_ROOT` 使用 `/`，`OPENLIST_CATALOG_FILE` 使用 `/catalog.json`。
