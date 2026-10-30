import { GaugeChart } from "@/components/charts/GaugeChart";
import type { PulseResponse } from "@/lib/dispatch/dispatch-pulse.types";
import { BentoCard } from "../../../admin/components/bento/BentoCard";
import { formatMinutes } from "./pulse-format";

// Mean minutes from a new booking to the dispatcher's first action today.
// The arc turns red past the threshold tick.
export function PulseResponseCard({ response }: { response: PulseResponse }) {
  const value = response.avgMinutes;
  const over = value !== null && value > response.thresholdMinutes;
  const max = Math.max(response.thresholdMinutes * 1.5, value ?? 0);
  const text = value === null ? "—" : formatMinutes(value);

  return (
    <BentoCard
      label="Thời gian phản hồi trung bình"
      className="flex flex-col items-center"
    >
      <h3 className="self-stretch text-base font-extrabold text-[#1E3A5F] dark:text-zinc-50">
        Thời gian phản hồi TB
      </h3>
      <GaugeChart
        value={value ?? 0}
        max={max}
        threshold={response.thresholdMinutes}
        label={
          value === null
            ? "Chưa có đơn nào được phản hồi hôm nay"
            : `Phản hồi trung bình ${text} phút, ngưỡng ${response.thresholdMinutes} phút`
        }
        className="mt-3 h-28 w-56"
      />
      <p
        className={`-mt-9 text-3xl font-extrabold tabular-nums ${
          over
            ? "text-red-600 dark:text-red-400"
            : "text-[#1E3A5F] dark:text-zinc-50"
        }`}
      >
        {text}
      </p>
      <p className="text-xs text-zinc-600 dark:text-zinc-400">
        phút · ngưỡng {response.thresholdMinutes} phút
      </p>
      <p className="mt-2 text-center text-xs text-zinc-600 dark:text-zinc-400">
        {response.samples === 0
          ? "Chưa có đơn nào được xử lý hôm nay"
          : `${response.overThreshold}/${response.samples} đơn phản hồi chậm hơn ngưỡng`}
      </p>
    </BentoCard>
  );
}
