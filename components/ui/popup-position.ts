// Pure placement for picker popups, in viewport pixels. The popup opens under
// its trigger, flips above when only that side fits, and otherwise stays
// inside the viewport with its height capped so its content scrolls.

const GAP = 8;
const EDGE = 8;

export type PopupAlign = "start" | "center";
export type PopupWidth = (
  triggerWidth: number,
  viewportWidth: number,
) => number;

type Rect = { left: number; top: number; bottom: number; width: number };
type Viewport = { width: number; height: number };

export type PopupPlacement = {
  left: number;
  top: number;
  width: number;
  maxHeight: number;
};

export function placePopup(
  trigger: Rect,
  panelHeight: number,
  viewport: Viewport,
  width: number,
  align: PopupAlign,
): PopupPlacement {
  const fitted = Math.min(width, viewport.width - EDGE * 2);
  const wanted =
    align === "center"
      ? trigger.left + trigger.width / 2 - fitted / 2
      : trigger.left;
  const left = Math.max(EDGE, Math.min(wanted, viewport.width - fitted - EDGE));

  const maxHeight = viewport.height - EDGE * 2;
  const below = trigger.bottom + GAP;
  const above = trigger.top - GAP - panelHeight;
  const fitsBelow = below + panelHeight <= viewport.height - EDGE;
  let top = below;
  if (!fitsBelow) {
    top =
      above >= EDGE
        ? above
        : Math.max(EDGE, viewport.height - EDGE - panelHeight);
  }
  return { left, top, width: fitted, maxHeight };
}
