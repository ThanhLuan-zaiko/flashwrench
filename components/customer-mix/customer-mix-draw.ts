// Pure canvas draw functions for the member-vs-guest charts. Monochrome
// palette resolved from the zinc scale at draw time (see revenue-draw), so
// both themes render from the same code. Kept React-free for testability.
import {
  type ChartColors,
  compactVnd,
  niceCeil,
} from "@/components/revenue/revenue-draw";

export type ChannelPoint = {
  key: string;
  label: string;
  member: number;
  guest: number;
};

export type SplitRow = { member: number; guest: number };

const PAD = { top: 12, right: 4, bottom: 22, left: 4 };
const TOP_RADIUS: [number, number, number, number] = [3, 3, 0, 0];

// Stacked member+guest columns, one per bucket. Member fills in ink from
// the baseline, guest stacks in muted above — the column top is the total,
// the seam is the channel split. Progress grows columns bottom-up.
export function drawChannelColumns(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  progress: number,
  points: ChannelPoint[],
  colors: ChartColors,
): void {
  const innerW = width - PAD.left - PAD.right;
  const innerH = height - PAD.top - PAD.bottom;
  if (innerW <= 0 || innerH <= 0) return;
  const max = niceCeil(Math.max(...points.map((p) => p.member + p.guest), 0));

  ctx.font = "10px ui-sans-serif, system-ui, sans-serif";
  ctx.lineWidth = 1;
  for (const ratio of [0, 0.5, 1]) {
    const y = PAD.top + innerH * (1 - ratio);
    ctx.strokeStyle = colors.faint;
    ctx.beginPath();
    ctx.moveTo(PAD.left, y);
    ctx.lineTo(width - PAD.right, y);
    ctx.stroke();
    ctx.fillStyle = colors.muted;
    ctx.fillText(compactVnd(max * ratio), PAD.left + 2, y - 3);
  }

  const n = points.length;
  if (n === 0) return;
  const slot = innerW / n;
  const barW = Math.min(36, Math.max(4, slot * 0.55));
  const baseY = PAD.top + innerH;

  points.forEach((p, i) => {
    const total = p.member + p.guest;
    if (total === 0) return;
    const totalH = innerH * (total / max) * progress;
    const memberH = (totalH * p.member) / total;
    const guestH = totalH - memberH;
    const x = PAD.left + slot * i + (slot - barW) / 2;
    if (memberH > 0) {
      ctx.fillStyle = colors.ink;
      ctx.beginPath();
      // Member alone tops the column: it takes the rounded cap instead.
      ctx.roundRect(
        x,
        baseY - memberH,
        barW,
        memberH,
        guestH > 0 ? 0 : TOP_RADIUS,
      );
      ctx.fill();
    }
    if (guestH > 0) {
      ctx.fillStyle = colors.muted;
      ctx.beginPath();
      ctx.roundRect(x, baseY - totalH, barW, guestH, TOP_RADIUS);
      ctx.fill();
    }
  });

  // Sparse x labels so a month of days still reads.
  const step = Math.max(1, Math.ceil(n / 6));
  ctx.fillStyle = colors.muted;
  points.forEach((p, i) => {
    if (i % step !== 0) return;
    const cx = PAD.left + slot * i + slot / 2;
    ctx.fillText(p.label, cx - 10, height - 6);
  });
}

// One member-share bar per row (order kinds): the ink fill is the member
// fraction of member+guest, the faint track reads as the guest remainder.
export function drawSplitRows(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  progress: number,
  rows: SplitRow[],
  colors: ChartColors,
): void {
  const count = rows.length;
  if (count === 0) return;
  const rowH = height / count;
  const barH = Math.min(10, rowH * 0.4);
  rows.forEach((row, index) => {
    const y = index * rowH;
    const total = row.member + row.guest;
    const share = total === 0 ? 0 : row.member / total;
    const local = Math.min(1, Math.max(0, progress * count - index));
    ctx.fillStyle = colors.faint;
    ctx.beginPath();
    ctx.roundRect(0, y + rowH - barH - 4, width, barH, barH / 2);
    ctx.fill();
    const target = width * share;
    if (local > 0 && target > 0) {
      ctx.fillStyle = colors.ink;
      ctx.beginPath();
      ctx.roundRect(0, y + rowH - barH - 4, target * local, barH, barH / 2);
      ctx.fill();
    }
  });
}
