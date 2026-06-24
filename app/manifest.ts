import type { MetadataRoute } from "next";

// PWA：添加到主屏幕后以 standalone 启动，无 Safari 地址栏/状态栏，
// 播放器的旋转全屏即变“真全屏”，且保留全部自定义控件（iPhone Safari 标签页做不到真全屏，这是唯一路径）。
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "魔法学习王国",
    short_name: "学习王国",
    description: "AI 精灵陪伴的中文 / 英语 / 数学 / 写字 / 故事闯关学习平台",
    start_url: "/",
    display: "standalone",
    orientation: "any",
    background_color: "#0f172a",
    theme_color: "#7dd3fc",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "maskable" },
    ],
  };
}
