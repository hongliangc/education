// content/history/dynastyTimeline.ts
// 「上下五千年历史长卷」入口数据：8 个时代分组 / 38 个朝代。
// 仅 three-kingdoms 当前可进入（active），其余为「敬请期待」。
// 封面图见 public/history/covers/<id>.webp（由 朝代插图 PNG 经 sharp 压缩生成）。

export interface DynastyItem {
  /** ascii slug，同时是封面文件名与（active 时的）子路由 */
  id: string;
  name: string;
  /** 起止年代，如 "220—280" */
  time: string;
  /** 代表事件/关键词 */
  keyword: string;
  /** 封面图路径，null 表示暂缺、用占位牌 */
  cover: string | null;
  /** 是否已开放进入 */
  active: boolean;
  /** active 时点击跳转的路由 */
  href?: string;
}

export interface DynastyGroup {
  /** ascii slug，用于 era tab 定位 */
  id: string;
  /** 完整分组名（竖牌） */
  label: string;
  /** 顶部 era tab 短标签 */
  tab: string;
  items: DynastyItem[];
}

const cover = (id: string): string => `/history/covers/${id}.webp`;

function dyn(
  id: string,
  name: string,
  time: string,
  keyword: string,
  active = false,
): DynastyItem {
  return {
    id,
    name,
    time,
    keyword,
    cover: cover(id),
    active,
    href: active ? `/history/${id}` : undefined,
  };
}

export const DYNASTY_TIMELINE: DynastyGroup[] = [
  {
    id: "yuangu",
    label: "远古",
    tab: "远古",
    items: [dyn("sanhuang-wudi", "三皇五帝", "约前3000—前2070", "尧舜禹禅让")],
  },
  {
    id: "xianqin",
    label: "先秦",
    tab: "先秦",
    items: [
      dyn("xia", "夏朝", "约前2070—前1600", "大禹治水"),
      dyn("shang", "商朝", "约前1600—前1046", "武丁中兴"),
      dyn("western-zhou", "西周", "前1046—前771", "牧野之战"),
      dyn("chunqiu", "春秋", "前770—前476", "春秋争霸"),
      dyn("zhanguo", "战国", "前475—前221", "合纵连横"),
    ],
  },
  {
    id: "qinhan",
    label: "秦汉",
    tab: "秦汉",
    items: [
      dyn("qin", "秦朝", "前221—前207", "统一六国"),
      dyn("western-han", "西汉", "前202—公元8", "丝绸之路"),
      dyn("xin", "新朝", "9—23", "王莽改制"),
      dyn("eastern-han", "东汉", "25—220", "光武中兴"),
    ],
  },
  {
    id: "weijin",
    label: "三国两晋南北朝",
    tab: "魏晋",
    items: [
      dyn("three-kingdoms", "三国", "220—280", "火烧赤壁", true),
      dyn("wei", "魏", "220—266", "官渡之战"),
      dyn("shu-han", "蜀汉", "221—263", "蜀汉建国"),
      dyn("wu", "吴", "222—280", "赤壁破曹"),
      dyn("western-jin", "西晋", "266—316", "一统三国"),
      dyn("eastern-jin", "东晋", "317—420", "淝水之战"),
      dyn("sixteen-kingdoms", "十六国", "304—439", "五胡并立"),
      dyn("southern-dynasties", "南朝", "420—589", "江南开发"),
      dyn("northern-dynasties", "北朝", "386—581", "孝文改革"),
    ],
  },
  {
    id: "suitang",
    label: "隋唐五代",
    tab: "隋唐",
    items: [
      dyn("sui", "隋朝", "581—618", "大运河"),
      dyn("tang", "唐朝", "618—907", "贞观之治"),
      dyn("wu-zhou", "武周", "690—705", "女皇临朝"),
      dyn("later-liang", "后梁", "907—923", "朱温代唐"),
      dyn("later-tang", "后唐", "923—936", "灭梁建唐"),
      dyn("later-jin", "后晋", "936—947", "燕云十六州"),
      dyn("later-han", "后汉", "947—950", "河东起兵"),
      dyn("later-zhou", "后周", "951—960", "世宗改革"),
      dyn("ten-kingdoms", "十国", "902—979", "割据并立"),
    ],
  },
  {
    id: "songyuan",
    label: "宋辽夏金",
    tab: "宋辽",
    items: [
      dyn("northern-song", "北宋", "960—1127", "陈桥兵变"),
      dyn("southern-song", "南宋", "1127—1279", "精忠报国"),
      dyn("liao", "辽朝", "916—1125", "澶渊之盟"),
      dyn("western-xia", "西夏", "1038—1227", "党项建国"),
      dyn("jin", "金朝", "1115—1234", "靖康之变"),
    ],
  },
  {
    id: "yuanming",
    label: "元明清",
    tab: "元明",
    items: [
      dyn("yuan", "元朝", "1271—1368", "大一统帝国"),
      dyn("ming", "明朝", "1368—1644", "郑和下西洋"),
      dyn("qing", "清朝", "1636—1912", "康乾盛世"),
    ],
  },
  {
    id: "jindai",
    label: "近现代",
    tab: "近现代",
    items: [
      dyn("roc", "中华民国", "1912—1949", "共和肇始"),
      dyn("prc", "中华人民共和国", "1949—至今", "民族复兴"),
    ],
  },
];
