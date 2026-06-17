# 视频影院 · 文件夹驱动分类与海报

正文见外部 wiki：`/mnt/e/workspace/knowledge-wiki/wiki/projects/mlk/specs/2026-06-14-theater-folder-categories-design.md`

`/videos` 下子文件夹=分类，文件=视频；孩子端两级浏览（分类卡片→视频列表→解锁播放）。海报三级回退（同名图→阿里云盘缩略图→占位）。`catalog.json` 降为可选覆盖层，id 由相对路径哈希派生。基于 [[2026-06-13-alipan-personal-video-source-design]] 的 OpenList+AliyundriveOpen 数据源，不改播放/鉴权/解锁。
