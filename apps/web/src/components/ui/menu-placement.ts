// Gap between the trigger and the panel, and the margin kept from the viewport edges.
const GAP = 4;
const MARGIN = 8;

type Rect = { top: number; bottom: number; left: number; right: number };
type Size = { width: number; height: number };

export type MenuPlacement = { top: number; left: number; maxHeight: number; side: "below" | "above" };

// Opens below and left-aligned to the trigger; right-aligns when that would overflow the right edge
// and opens upward when there is more room above than below.
export const placeMenuPanel = (anchor: Rect, panel: Size, viewport: Size): MenuPlacement => {
  const spaceBelow = viewport.height - anchor.bottom - GAP - MARGIN;
  const spaceAbove = anchor.top - GAP - MARGIN;
  const side = panel.height > spaceBelow && spaceAbove > spaceBelow ? "above" : "below";
  const maxHeight = Math.max(0, side === "above" ? spaceAbove : spaceBelow);
  const height = Math.min(panel.height, maxHeight);
  const top = side === "above" ? anchor.top - GAP - height : anchor.bottom + GAP;

  const fitsLeftAligned = anchor.left + panel.width <= viewport.width - MARGIN;
  const preferredLeft = fitsLeftAligned ? anchor.left : anchor.right - panel.width;
  const left = Math.max(MARGIN, Math.min(preferredLeft, viewport.width - MARGIN - panel.width));

  return { top, left, maxHeight, side };
};
