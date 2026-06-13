// Shared ten-frame layout (SVG user units) and palette for the make-ten / break-ten stages.
export const VB_W = 480;
export const VB_H = 320;
export const COLS = 5;
export const ROWS = 2;
export const CELL = 54;
export const GAP = 6;
export const R = 21; // dot radius
export const FRAME_W = COLS * CELL + (COLS - 1) * GAP;
export const FRAME_H = ROWS * CELL + (ROWS - 1) * GAP;
export const FX = (VB_W - FRAME_W) / 2;
export const FY = 64; // headroom above the frame so the badge clears the top row of dots
export const LOOSE_Y = FY + FRAME_H + 58;
export const LOOSE_SPACING = 46;
export const GROUP_GAP = 26;

export const BLUE = "#3b82f6";
export const BLUE_HI = "#bfdbfe";
export const GOLD = "#f59e0b";
export const GOLD_HI = "#fde68a";
export const ORANGE = "#fb923c";
export const EMERALD = "#10b981";
export const RED = "#ef4444";

export type Pt = { x: number; y: number };

export function cellCenter(i: number): Pt {
  const c = i % COLS;
  const r = Math.floor(i / COLS);
  return { x: FX + c * (CELL + GAP) + CELL / 2, y: FY + r * (CELL + GAP) + CELL / 2 };
}

// Where loose dots sit below the frame. `count` is the size of the row; from `withGap` on, the
// sub-group at index >= `splitAt` is pulled apart by GROUP_GAP so a decomposition reads at a glance.
export function loosePos(j: number, count: number, splitAt: number, withGap: boolean): Pt {
  const total = (count - 1) * LOOSE_SPACING + (withGap ? GROUP_GAP : 0);
  const startX = VB_W / 2 - total / 2;
  const extra = withGap && j >= splitAt ? GROUP_GAP : 0;
  return { x: startX + j * LOOSE_SPACING + extra, y: LOOSE_Y };
}
