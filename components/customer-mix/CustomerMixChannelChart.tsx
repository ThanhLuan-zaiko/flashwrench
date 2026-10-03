"use client";

import { resolveChartColors } from "@/components/revenue/revenue-draw";
import { useCanvasChart } from "@/hooks/useCanvasChart";
import { type ChannelPoint, drawChannelColumns } from "./customer-mix-draw";
import { GUEST_LABEL, MEMBER_LABEL } from "./customer-mix-format";

type CustomerMixChannelChartProps = {
  points: ChannelPoint[];
  label: string;
  emptyHint: string;
};

// Stacked member/guest columns over the report buckets. The canvas is a11y
// -invisible: the legend rows carry the totals and a sr-only list carries
// every bucket's split as text.
export function CustomerMixChannelChart({
  points,
  label,
  emptyHint,
}: CustomerMixChannelChartProps) {
  const signature = points
    .map((p) => `${p.key}:${p.member}:${p.guest}`)
    .join("|");
  const canvasRef = useCanvasChart(
    (ctx, w, h, progress) =>
      drawChannelColumns(ctx, w, h, progress, points, resolveChartColors()),
    [signature],
  );

  const member = points.reduce((sum, p) => sum + p.member, 0);
  const guest = points.reduce((sum, p) => sum + p.guest, 0);
  if (member + guest === 0) {
    return (
      <p className="py-8 text-center text-sm text-zinc-500 dark:text-zinc-400">
        {emptyHint}
      </p>
    );
  }

  return (
    <div>
      <canvas
        ref={canvasRef}
        role="img"
        aria-label={`Biểu đồ ${label}`}
        className="h-44 w-full sm:h-52"
      />
      <ul aria-label={`Số liệu ${label}`} className="sr-only">
        {points.map((p) => (
          <li key={p.key}>
            {p.label}: {p.member} {MEMBER_LABEL.toLowerCase()}, {p.guest}{" "}
            {GUEST_LABEL.toLowerCase()}
          </li>
        ))}
      </ul>
      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-zinc-600 dark:text-zinc-300">
        <span className="flex items-center gap-1.5">
          <span
            aria-hidden="true"
            className="h-2.5 w-2.5 rounded-sm bg-zinc-900 dark:bg-zinc-50"
          />
          {MEMBER_LABEL}: <strong>{member}</strong>
        </span>
        <span className="flex items-center gap-1.5">
          <span
            aria-hidden="true"
            className="h-2.5 w-2.5 rounded-sm bg-zinc-500 dark:bg-zinc-400"
          />
          {GUEST_LABEL}: <strong>{guest}</strong>
        </span>
      </div>
    </div>
  );
}
