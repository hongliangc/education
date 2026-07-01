// 三国详情页共享视觉令牌与资源路径。绢面/鎏金/墨沿用历史板块；阵营色来自内容数据。
export const TK = {
  parchment: "#F3ECDA",
  parchmentDeep: "#EAD9A8",
  gold: "#C9A24B",
  goldDeep: "#A77F32",
  ink: "#2B2622",
  cinnabar: "#C8352B", // 朱砂印
} as const;

export const KIT = "/history/three-kingdoms/kit/png";
export const BG_TILE = `${KIT}/parchment_detail_tile.png`;
export const TITLE_PLAQUE = `${KIT}/dynasty_vertical_title_plaque.png`;
export const MAP_IMG = "/history/three-kingdoms/map/three-kingdoms-map.webp"; // 整幅三国势力地图

/** 人物立绘缩略图路径（卡墙用，减轻一次铺多张的下载）；弹窗/看大图/阅读插图仍用全尺寸。 */
export const peopleThumb = (img: string): string => img.replace("/people/", "/people/thumb/");

/** 鎏金描边卷面板（绢底 + 金边 + 阴影）通用 style。 */
export const panelStyle: React.CSSProperties = {
  background: TK.parchment,
  border: `2px solid ${TK.gold}`,
  boxShadow: "0 8px 22px rgba(0,0,0,.35), inset 0 0 0 1px rgba(201,162,75,.35)",
};
