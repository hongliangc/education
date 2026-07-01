// scripts/optimize-three-kingdoms-art.mjs
// 把三国插图库（~3MB PNG）压成 WebP，供三国详情页群英谱/事件时间线使用。
// 源：todo/上下五千年/具体朝代设计/三国/{蜀汉,魏国,东吴,中立,事件}/<中文名>.png（不入库）
// 出：public/history/three-kingdoms/{people,events}/<slug>.webp（入库）
// 用法：node scripts/optimize-three-kingdoms-art.mjs
// 扩展：往 PEOPLE / EVENTS 加行（中文文件名 → slug）后重跑即可补图。
import sharp from "sharp";
import { mkdir, stat } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SRC = path.join(ROOT, "todo/上下五千年/具体朝代设计/三国");
const OUT = path.join(ROOT, "public/history/three-kingdoms");

// [中文文件名(无扩展名), slug, 阵营文件夹]
const PEOPLE = [
  // 蜀汉
  ["刘备 (2)", "liubei", "蜀汉"],
  ["关羽", "guanyu", "蜀汉"],
  ["张飞 (2)", "zhangfei", "蜀汉"],
  ["诸葛亮", "zhugeliang", "蜀汉"],
  ["赵云", "zhaoyun", "蜀汉"],
  ["马超", "machao", "蜀汉"],
  ["黄忠", "huangzhong", "蜀汉"],
  // 魏国
  ["曹操", "caocao", "魏国"],
  ["司马懿", "simayi", "魏国"],
  ["郭嘉", "guojia", "魏国"],
  ["张辽", "zhangliao", "魏国"],
  // 东吴
  ["孙权", "sunquan", "东吴"],
  ["周瑜", "zhouyu", "东吴"],
  ["鲁肃", "lusu", "东吴"],
  ["黄盖", "huanggai", "东吴"],
  ["孙策", "sunce", "东吴"],
  ["陆逊", "luxun", "东吴"],
  // 群雄（中立）
  ["吕布", "lvbu", "中立"],
  ["貂蝉 (2)", "diaochan", "中立"],
  ["董卓", "dongzhuo", "中立"],
];

const EVENTS = [
  ["黄巾起义", "huangjin"],
  ["草船借箭", "caochuanjiejian"],
  ["长坂坡之战", "changbanpo"],
  ["连环计", "lianhuanji"],
  ["煮酒论英雄", "zhujiulunyingxiong"],
];

// [子目录, 中文文件名(无扩展名), slug] → public/history/three-kingdoms/<子目录>/<slug>.webp
const MAPS = [["地图", "三国地图", "three-kingdoms-map"]];

// 全尺寸用于「点击看大图」lightbox / 弹窗 / 阅读插图，取近源分辨率避免放大模糊；
// 群英谱卡墙一次铺 ~20 张，另出 thumb 缩略（people/thumb/）控总下载，卡片端用 thumb。
const PEOPLE_WIDTH = 1024; // 立绘源 1122 宽，近源即可全屏清晰
const PEOPLE_THUMB_WIDTH = 480; // 群英谱卡墙缩略
const EVENT_WIDTH = 1024; // 事件图源 1122 宽
const MAP_WIDTH = 1536; // 势力地图源 1536 宽，全屏看细节用原宽
const QUALITY = 82;

async function convert(srcFile, outFile, width) {
  if (!existsSync(srcFile)) {
    console.warn(`  ✗ 源缺失: ${srcFile}`);
    return false;
  }
  await sharp(srcFile)
    .resize({ width, withoutEnlargement: true })
    .webp({ quality: QUALITY })
    .toFile(outFile);
  const { size } = await stat(outFile);
  console.log(`  ✓ ${path.basename(outFile)}  ${(size / 1024).toFixed(0)}K`);
  return true;
}

async function run() {
  await mkdir(path.join(OUT, "people"), { recursive: true });
  await mkdir(path.join(OUT, "people", "thumb"), { recursive: true });
  await mkdir(path.join(OUT, "events"), { recursive: true });
  await mkdir(path.join(OUT, "map"), { recursive: true });

  console.log(`人物（${PEOPLE.length}，全尺寸 + thumb）:`);
  let ok = 0;
  for (const [cn, slug, folder] of PEOPLE) {
    const src = path.join(SRC, folder, `${cn}.png`);
    const out = path.join(OUT, "people", `${slug}.webp`);
    const thumb = path.join(OUT, "people", "thumb", `${slug}.webp`);
    if (await convert(src, out, PEOPLE_WIDTH)) ok++;
    await convert(src, thumb, PEOPLE_THUMB_WIDTH);
  }
  console.log(`事件（${EVENTS.length}）:`);
  for (const [cn, slug] of EVENTS) {
    const src = path.join(SRC, "事件", `${cn}.png`);
    const out = path.join(OUT, "events", `${slug}.webp`);
    if (await convert(src, out, EVENT_WIDTH)) ok++;
  }
  console.log(`地图（${MAPS.length}）:`);
  for (const [folder, cn, slug] of MAPS) {
    const src = path.join(SRC, folder, `${cn}.png`);
    const out = path.join(OUT, "map", `${slug}.webp`);
    if (await convert(src, out, MAP_WIDTH)) ok++;
  }
  console.log(`完成：${ok}/${PEOPLE.length + EVENTS.length + MAPS.length}`);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
