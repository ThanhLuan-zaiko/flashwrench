import { BarRowsChart } from "@/components/charts/BarRowsChart";
import type { DispatchPulse } from "@/lib/dispatch/dispatch-pulse.types";
import { BentoCard } from "../../../admin/components/bento/BentoCard";
import { FUNNEL_LABELS, formatRate } from "./pulse-format";

// Today's bookings by board stage as stacked horizontal tracks; a status
// change on the operations feed moves one unit and the bars resize.
export function PulseFunnelCard({ pulse }: { pulse: DispatchPulse }) {
  const summary = pulse.funnel
    .map((step) => `${FUNNEL_LABELS[step.stage]}: ${step.count}`)
    .join("; ");

  return (
    <BentoCard label="Phễu trạng thái" className="flex flex-col">
      <h3 className="text-base font-extrabold text-[#1E3A5F] dark:text-zinc-50">
        Phễu trạng thái
      </h3>
      <p className="text-xs text-zinc-600 dark:text-zinc-400">
        Đơn hẹn trong ngày · {pulse.cancelledToday} huỷ hoặc vắng mặt
      </p>
      <div className="mt-4 flex gap-3">
        <ul className="flex flex-col">
          {pulse.funnel.map((step) => (
            <li
              key={step.stage}
              className="flex h-12 items-center text-[13px] font-semibold text-zinc-700 dark:text-zinc-300"
            >
              {FUNNEL_LABELS[step.stage]}
            </li>
          ))}
        </ul>
        <BarRowsChart
          values={pulse.funnel.map((step) => step.count)}
          label={summary}
          className="h-48 min-w-0 flex-1"
        />
        <ul className="flex flex-col">
          {pulse.funnel.map((step) => (
            <li
              key={step.stage}
              className="flex h-12 items-center justify-end text-[13px] font-extrabold text-[#1E3A5F] tabular-nums dark:text-zinc-50"
            >
              {step.count}
            </li>
          ))}
        </ul>
      </div>
      <p className="mt-auto pt-3 text-xs text-zinc-600 dark:text-zinc-400">
        Tỉ lệ hoàn tất:{" "}
        <b className="text-[#1E3A5F] dark:text-zinc-50">
          {formatRate(pulse.completionRate)}
        </b>
      </p>
    </BentoCard>
  );
}
