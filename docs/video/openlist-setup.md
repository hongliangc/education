# OpenList 阿里云盘视频源（文件夹分类）

1. 启动服务：`docker compose up -d openlist`
2. 在服务器本机打开 `http://127.0.0.1:5244`，立即修改初始管理员密码。
3. 在 OpenList 中添加 `AliyundriveOpen` 存储并完成 OAuth：
   - `drive_type` 选 **备份盘（backup）**——视频通常在备份盘，挂到资源库会看不到；
   - `root_folder_id` 指向一个**只放给孩子看的内容根文件夹**（在备份盘新建一个即可，名字随意），它的直接子文件夹就是分类；
   - `mount_path` 设为 `/videos`（这是 OpenList 的挂载路径，不是阿里云盘里必须叫 videos 的目录）。
4. 在内容根下按分类建文件夹，把视频放进去（**文件夹名即分类名**）：
   ```text
   <内容根>/动画/冰雪奇缘.mp4
   <内容根>/动画/冰雪奇缘.jpg        ← 同名海报，可选
   <内容根>/英语/Steve and Maggie 01.mp4
   <内容根>/科普/完美星球 01.mp4
   ```
5. 海报可不传：缺省用阿里云盘自动生成的视频缩略图；想要自定义就放一张与视频同名的图片。
6. （可选）`catalog.json` 放到内容根下，仅用于覆盖分类标题/排序与单个视频的标题/价格/年龄段/海报。格式见 `catalog.example.json`。
7. 新建普通用户 `mlk-video`，`base_path` 设为内容根、权限值设为 `0`（只读）；应用不得使用管理员账号。
8. 配置 `OPENLIST_USERNAME`、`OPENLIST_PASSWORD` 等环境变量；应用侧 `OPENLIST_VIDEO_ROOT` 用 `/`。
9. 使用真实视频执行 `npm run videos:verify-openlist`，确认 M3U8、媒体分片和 CORS 全部通过。

视频 id（由 `分类/文件名` 派生的稳定哈希，或在 `catalog.json` 里钉死的显式 `id`）是奖励解锁记录的永久业务键。
**重命名或移动视频会改变派生 id，从而使解锁记录错位**——重要付费内容请在 `catalog.json` 里指定显式 `id`。
