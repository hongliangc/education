// components/history/HistoryScroll.tsx
// 「上下五千年历史长卷」入口：合卷 → 点击展开 → 横向长卷（PC 滚轮/拖动）/ 竖向（手机）。
// 三国卡进入 /history/three-kingdoms，其余朝代弹「敬请期待」提示。
"use client";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { useRouter } from "next/navigation";
import { DYNASTY_TIMELINE, type DynastyItem } from "@/content/history/dynastyTimeline";
import { DynastyCard } from "@/components/history/DynastyCard";

const KIT = "/history/kit/png/";
const BRUSH = "var(--font-history)";
const SERIF = "var(--font-history)";
const CARD_H = 440;
const CARD_W = 320;
const DESK_H = "510px"; // 卷轴可视高度（单排，卡片放大突出插图）

export function HistoryScroll() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [activeEra, setActiveEra] = useState("all");
  const [toast, setToast] = useState("");

  const scrollRef = useRef<HTMLDivElement | null>(null);
  const sectionsRef = useRef<Record<string, HTMLDivElement | null>>({});
  const dragRef = useRef<{ x: number; s: number } | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 760);
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // PC 端：滚轮纵向→横向、按住拖动长卷
  useEffect(() => {
    const node = scrollRef.current;
    if (!node || isMobile || !open) return;
    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
        node.scrollLeft += e.deltaY;
        e.preventDefault();
      }
    };
    const onDown = (e: PointerEvent) => {
      dragRef.current = { x: e.clientX, s: node.scrollLeft };
      node.style.cursor = "grabbing";
    };
    const onMove = (e: PointerEvent) => {
      if (!dragRef.current) return;
      node.scrollLeft = dragRef.current.s - (e.clientX - dragRef.current.x);
    };
    const onUp = () => {
      if (dragRef.current) node.style.cursor = "grab";
      dragRef.current = null;
    };
    node.addEventListener("wheel", onWheel, { passive: false });
    node.addEventListener("pointerdown", onDown);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      node.removeEventListener("wheel", onWheel);
      node.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, [open, isMobile]);

  useEffect(() => () => { if (toastTimer.current) clearTimeout(toastTimer.current); }, []);

  const gotoEra = (key: string) => {
    setActiveEra(key);
    if (key === "all") {
      if (isMobile) window.scrollTo({ top: 0, behavior: "smooth" });
      else scrollRef.current?.scrollTo({ left: 0, behavior: "smooth" });
      return;
    }
    const node = sectionsRef.current[key];
    if (!node) return;
    if (isMobile) {
      window.scrollTo({ top: node.getBoundingClientRect().top + window.scrollY - 80, behavior: "smooth" });
    } else {
      scrollRef.current?.scrollTo({ left: Math.max(0, node.offsetLeft - 16), behavior: "smooth" });
    }
  };

  const selectDynasty = (item: DynastyItem) => {
    if (item.active && item.href) {
      router.push(item.href);
      return;
    }
    setToast(`「${item.name}」朝代正在绘制中，敬请期待`);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(""), 2200);
  };

  // ---------- styles ----------
  const rootStyle: CSSProperties = {
    minHeight: "100vh", width: "100%", display: "flex", flexDirection: "column", alignItems: "center",
    justifyContent: "flex-start", background: "radial-gradient(125% 95% at 50% 10%, #3c2614 0%, #271809 52%, #150c04 100%)",
    fontFamily: SERIF, padding: "0 0 48px", overflowX: "hidden", position: "relative",
  };
  const titleStyle: CSSProperties = {
    fontFamily: BRUSH, fontWeight: 400, fontSize: isMobile ? "34px" : "clamp(42px,6vw,78px)", lineHeight: 1.08,
    background: "linear-gradient(180deg,#fbe7a4 0%,#e8c45a 46%,#c5901f 100%)", WebkitBackgroundClip: "text",
    backgroundClip: "text", WebkitTextFillColor: "transparent", color: "transparent", letterSpacing: isMobile ? "3px" : "6px",
    margin: 0, filter: "drop-shadow(0 2px 4px rgba(80,40,8,.55))",
  };
  const tabBarStyle: CSSProperties = {
    display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "9px",
    padding: open ? (isMobile ? "8px 14px" : "14px 20px 8px") : "0 14px",
    maxHeight: open ? "160px" : "0px", overflow: "hidden", opacity: open ? 1 : 0,
    pointerEvents: open ? "auto" : "none", transition: "opacity .5s ease .2s, max-height .5s ease, padding .5s ease", zIndex: 3,
  };
  const stageStyle: CSSProperties = {
    position: "relative", display: "flex", flexDirection: isMobile ? "column" : "row", alignItems: "center",
    justifyContent: "center", width: "100%", padding: isMobile ? "6px 0" : "8px 0", zIndex: 2,
  };
  const rod = (side: "left" | "right"): CSSProperties =>
    isMobile
      ? { width: "94vw", maxWidth: "560px", height: "26px", flex: "0 0 auto", borderRadius: "14px",
          background: "linear-gradient(180deg,#d3aa5d,#9a6a32 32%,#724824 58%,#3f2614)", border: "1.5px solid #5a3414",
          boxShadow: "0 4px 10px rgba(0,0,0,.45), inset 0 1px 2px rgba(255,233,176,.4)", zIndex: 6 }
      : { width: "58px", height: DESK_H, flex: "0 0 auto", backgroundImage: `url(${KIT}scroll_rod_${side}.png)`,
          backgroundSize: "100% 100%", backgroundRepeat: "no-repeat", filter: "drop-shadow(0 6px 12px rgba(0,0,0,.55))", zIndex: 6 };
  const parchmentStyle: CSSProperties = {
    position: "relative", boxSizing: "border-box", borderStyle: "solid", borderWidth: "24px", borderColor: "transparent",
    borderImage: `url(${KIT}scroll_parchment_9slice.png) 48 fill stretch`, boxShadow: "0 18px 44px rgba(0,0,0,.55)",
    ...(isMobile
      ? { width: "94vw", maxWidth: "560px", maxHeight: open ? "9000px" : "0px", overflow: "hidden", transition: "max-height 1s cubic-bezier(.7,0,.2,1)" }
      : { width: open ? "min(1280px, 90vw)" : "0px", height: DESK_H, overflow: "hidden", transition: "width 1s cubic-bezier(.7,0,.2,1)" }),
  };
  const viewportStyle: CSSProperties = isMobile
    ? { position: "relative", padding: "8px 4px", opacity: open ? 1 : 0, transition: "opacity .5s ease .35s" }
    : { position: "absolute", top: "8px", left: "14px", right: "14px", bottom: "8px", overflowX: "auto", overflowY: "hidden",
        opacity: open ? 1 : 0, transition: "opacity .5s ease .4s", cursor: "grab" };
  const innerStyle: CSSProperties = isMobile
    ? { display: "flex", flexDirection: "column", gap: "22px", width: "100%", padding: "4px 8px" }
    : { display: "flex", flexDirection: "row", alignItems: "stretch", gap: "26px", height: "100%", width: "max-content", padding: "0 6px" };

  let idx = 0;
  return (
    <div style={rootStyle}>
      <div style={{ textAlign: "center", zIndex: 3, padding: isMobile ? "76px 16px 8px" : "92px 20px 12px" }}>
        <div style={titleStyle}>上下五千年历史长卷</div>
        <div style={{ fontFamily: SERIF, color: "#d8c7a0", fontSize: isMobile ? "13px" : "16px", letterSpacing: "2px", marginTop: "12px", opacity: 0.92, padding: "0 12px" }}>
          从三皇五帝到新时代，展开长卷，认识朝代更迭，解锁经典故事。
        </div>
      </div>

      <div style={tabBarStyle}>
        {[{ id: "all", tab: "全部" }, ...DYNASTY_TIMELINE.map((g) => ({ id: g.id, tab: g.tab }))].map((e) => {
          const on = activeEra === e.id;
          return (
            <div
              key={e.id}
              onClick={() => gotoEra(e.id)}
              style={{
                fontFamily: SERIF, fontSize: isMobile ? "13px" : "14px", padding: isMobile ? "6px 13px" : "7px 16px",
                borderRadius: "4px", cursor: "pointer", letterSpacing: "2px", whiteSpace: "nowrap", transition: "all .2s ease", userSelect: "none",
                ...(on
                  ? { background: "linear-gradient(180deg,#caa24a,#a87a25)", color: "#3a1d0c", border: "1.5px solid #f0d488", boxShadow: "0 0 14px rgba(232,196,90,.4)" }
                  : { background: "linear-gradient(180deg,#5e2118,#451410)", color: "#eccb6f", border: "1.5px solid #9a6a2e" }),
              }}
            >
              {e.tab}
            </div>
          );
        })}
      </div>

      <div style={stageStyle}>
        <div style={rod("left")} />
        <div style={parchmentStyle}>
          <div ref={scrollRef} className="scroll-hide" style={viewportStyle}>
            {open && (
              <div style={innerStyle}>
                {DYNASTY_TIMELINE.map((g) => (
                  <div
                    key={g.id}
                    ref={(n) => { sectionsRef.current[g.id] = n; }}
                    style={isMobile
                      ? { display: "flex", flexDirection: "column", gap: "12px" }
                      : { display: "flex", flexDirection: "row", alignItems: "stretch", gap: "14px", flex: "0 0 auto" }}
                  >
                    <div style={isMobile
                      ? { display: "inline-flex", alignItems: "center", padding: "7px 18px", alignSelf: "flex-start",
                          background: "linear-gradient(180deg,#7a2a1e,#591b12)", color: "#ecc457", fontFamily: BRUSH, fontSize: "22px",
                          letterSpacing: "4px", borderRadius: "6px", border: "1.5px solid #c89b3c",
                          boxShadow: "inset 0 0 0 3px rgba(200,155,60,.22), 0 4px 12px rgba(0,0,0,.4)", animation: "plaqueIn .6s ease both" }
                      : { writingMode: "vertical-rl", display: "flex", alignItems: "center", justifyContent: "center", width: "52px",
                          flex: "0 0 auto", padding: "16px 0", background: "linear-gradient(180deg,#7a2a1e,#591b12)", color: "#ecc457",
                          fontFamily: BRUSH, fontSize: "26px", letterSpacing: "8px", borderRadius: "6px", border: "1.5px solid #c89b3c",
                          boxShadow: "inset 0 0 0 3px rgba(200,155,60,.22), 0 4px 12px rgba(0,0,0,.4)", animation: "plaqueIn .6s ease both" }}>
                      {g.label}
                    </div>
                    <div style={isMobile
                      ? { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }
                      : { display: "grid", gridAutoFlow: "column", gridTemplateRows: `${CARD_H}px`, gridAutoColumns: `${CARD_W}px`, gap: "16px", alignContent: "center" }}>
                      {g.items.map((it) => <DynastyCard key={it.id} item={it} isMobile={isMobile} index={idx++} onSelect={selectDynasty} />)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        <div style={rod("right")} />
      </div>

      <div style={{ textAlign: "center", color: "#b89a6a", fontFamily: SERIF, fontSize: "13px", letterSpacing: "1px",
        maxHeight: open ? "60px" : "0px", opacity: open ? 1 : 0, overflow: "hidden",
        padding: open ? "16px 14px 4px" : "0 14px", transition: "opacity .5s ease .55s, max-height .5s ease, padding .5s ease", zIndex: 3 }}>
        {isMobile ? "向下滑动浏览各朝代 · 点击卡片进入学习" : "滚动滚轮 / 拖动长卷浏览 · 点击朝代封面进入学习"}
      </div>

      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "13px",
        maxHeight: open ? "0px" : "240px", opacity: open ? 0 : 1, overflow: "hidden",
        padding: open ? "0" : "30px 24px 8px", pointerEvents: open ? "none" : "auto",
        transition: "opacity .4s ease, max-height .5s ease, padding .5s ease", zIndex: 3 }}>
        <div
          onClick={() => setOpen(true)}
          style={{ fontFamily: BRUSH, fontSize: "25px", letterSpacing: "7px", color: "#fce9b0", padding: "13px 50px", borderRadius: "7px",
            border: "2px solid #e8c45a", background: "linear-gradient(180deg,#7a2a1e,#561a11)", cursor: "pointer",
            boxShadow: "0 6px 18px rgba(0,0,0,.45), inset 0 0 0 2px rgba(232,196,90,.18)", animation: "ctaPulse 2.4s ease-in-out infinite" }}
        >
          展开长卷
        </div>
        <div style={{ fontFamily: SERIF, fontSize: "13px", color: "#9e8456", letterSpacing: "2px" }}>点击展开历史长卷 · 收集朝代卡片</div>
      </div>

      <div style={{ position: "fixed", left: "50%", bottom: "46px",
        transform: toast ? "translateX(-50%) translateY(0)" : "translateX(-50%) translateY(16px)",
        padding: "12px 26px", borderRadius: "8px", background: "linear-gradient(180deg,#3a1d12,#27130b)", color: "#f6d98a",
        fontFamily: SERIF, fontSize: "15px", letterSpacing: "1px", border: "1.5px solid #c89b3c", boxShadow: "0 10px 30px rgba(0,0,0,.5)",
        opacity: toast ? 1 : 0, pointerEvents: "none", transition: "opacity .3s ease, transform .3s ease", zIndex: 40, whiteSpace: "nowrap" }}>
        {toast}
      </div>
    </div>
  );
}
