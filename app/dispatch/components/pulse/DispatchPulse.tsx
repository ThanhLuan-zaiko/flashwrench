"use client";

import { useDispatchPulse } from "@/hooks/dispatch-pulse";
import { PulseFunnelCard } from "./PulseFunnelCard";
import { PulseHeader } from "./PulseHeader";
import { PulseHourlyCard } from "./PulseHourlyCard";
import { PulseKpiRow } from "./PulseKpiRow";
import { PulseRescueList } from "./PulseRescueList";
import { PulseResponseCard } from "./PulseResponseCard";

// Live operations pulse above the dispatch board, laid out like the
// approved design: header, KPI row, hourly load + funnel, response gauge +
// open rescues. Mounted once by the route shell, so status-tab switches
// keep the canvases (no replay).
export function DispatchPulse() {
  const pulse = useDispatchPulse();

  if (pulse.isPending) {
    return (
      <div aria-busy="true" className="flex flex-col gap-3 md:gap-4">
        <div className="h-14 w-64 rounded-xl bg-zinc-100 motion-safe:animate-pulse dark:bg-zinc-900" />
        <div className="h-72 rounded-2xl bg-zinc-100 motion-safe:animate-pulse dark:bg-zinc-900" />
        <span className="sr-only">Đang tải nhịp vận hành</span>
      </div>
    );
  }

  if (pulse.isError || !pulse.data) {
    return (
      <p className="rounded-2xl border border-zinc-200 px-4 py-3 text-sm text-zinc-600 dark:border-zinc-800 dark:text-zinc-400">
        Không tải được nhịp vận hành. Danh sách đơn bên dưới vẫn dùng được.
      </p>
    );
  }

  const data = pulse.data;
  const openTotal = data.rescues.reduce((sum, step) => sum + step.count, 0);
  return (
    <section
      aria-label="Nhịp vận hành hôm nay"
      className="flex flex-col gap-3 md:gap-4"
    >
      <PulseHeader
        updatedAt={pulse.dataUpdatedAt}
        isFetching={pulse.isFetching}
      />
      <PulseKpiRow pulse={data} />
      <div className="grid grid-cols-1 gap-3 md:gap-4 lg:grid-cols-3">
        <PulseHourlyCard pulse={data} />
        <PulseFunnelCard pulse={data} />
      </div>
      <div className="grid grid-cols-1 gap-3 md:gap-4 lg:grid-cols-3">
        <PulseResponseCard response={data.response} />
        <PulseRescueList rescues={data.openRescues} total={openTotal} />
      </div>
      {data.truncated && (
        <p className="text-xs text-zinc-600 dark:text-zinc-400">
          Số liệu đang hiển thị một phần vì lượng đơn trong tháng rất lớn.
        </p>
      )}
    </section>
  );
}
