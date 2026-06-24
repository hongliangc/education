// 朝代条数据：第一期仅"三国"可进入，其余为"敬请期待"占位。纯数据，无 React。
export interface Dynasty {
  key: string;
  name: string;
  active: boolean; // 是否可进入（第一期仅 three-kingdoms）
}

export const DYNASTIES: Dynasty[] = [
  { key: "prehistoric", name: "远古", active: false },
  { key: "xia-shang-zhou", name: "夏商周", active: false },
  { key: "spring-autumn", name: "春秋战国", active: false },
  { key: "qin-han", name: "秦汉", active: false },
  { key: "three-kingdoms", name: "三国", active: true },
  { key: "sui-tang", name: "隋唐", active: false },
  { key: "song-yuan", name: "宋元", active: false },
  { key: "ming-qing", name: "明清", active: false },
  { key: "modern", name: "近现代", active: false },
];
