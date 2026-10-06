"use client";

import { useEffect, useState } from "react";
import { FiSave } from "react-icons/fi";
import { useToast } from "@/components/toast/useToast";
import { useDispatchSla, useSlaMutation } from "@/hooks/admin-rescue";
import { AdminRescueApiError } from "@/services/admin-rescue.api";

const INPUT_CLASSES =
  "min-h-[44px] w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50";

// SLA tuning for rescue auto-dispatch: offer lifetime, re-offer cap and
// candidate fan-out. Saved values apply to the next dispatch pass.
export function SlaConfigCard() {
  const toast = useToast();
  const sla = useDispatchSla();
  const save = useSlaMutation();
  const [timeoutSec, setTimeoutSec] = useState("30");
  const [maxReoffers, setMaxReoffers] = useState("10");
  const [candidateLimit, setCandidateLimit] = useState("50");
  const [loaded, setLoaded] = useState(false);

  const config = sla.data?.config;
  useEffect(() => {
    if (config && !loaded) {
      setTimeoutSec(String(Math.round(config.offerTimeoutMs / 1000)));
      setMaxReoffers(String(config.maxReoffers));
      setCandidateLimit(String(config.candidateLimit));
      setLoaded(true);
    }
  }, [config, loaded]);

  function handleSave() {
    save.mutate(
      {
        offerTimeoutSec: Number(timeoutSec),
        maxReoffers: Number(maxReoffers),
        candidateLimit: Number(candidateLimit),
      },
      {
        onSuccess: () =>
          toast.success("Đã lưu cấu hình", "Áp dụng cho lượt giao tiếp theo."),
        onError: (error) => {
          const message =
            error instanceof AdminRescueApiError
              ? (error.errors.offerTimeoutMs ??
                error.errors.maxReoffers ??
                error.errors.candidateLimit ??
                error.errors.form ??
                "Vui lòng kiểm tra lại.")
              : "Vui lòng thử lại sau.";
          toast.error("Không lưu được", message);
        },
      },
    );
  }

  return (
    <section
      aria-label="Cấu hình tự điều phối"
      data-tour="admin-rescue-sla"
      className="rounded-2xl border border-zinc-200 bg-white p-4 md:p-5 dark:border-zinc-800 dark:bg-zinc-950"
    >
      <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
        Tự điều phối
      </h2>
      <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
        {config?.isDefault
          ? "Đang dùng mặc định (30s · 10 lần · 50 thợ)."
          : "Đã tùy chỉnh — áp dụng ngay cho lượt giao tiếp theo."}
      </p>
      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <label className="flex flex-col gap-1.5 text-xs font-semibold text-zinc-700 dark:text-zinc-300">
          Chờ thợ mỗi lượt (giây)
          <input
            type="number"
            min={10}
            max={300}
            value={timeoutSec}
            onChange={(e) => setTimeoutSec(e.target.value)}
            disabled={sla.isPending || save.isPending}
            className={INPUT_CLASSES}
          />
        </label>
        <label className="flex flex-col gap-1.5 text-xs font-semibold text-zinc-700 dark:text-zinc-300">
          Số lần giao lại tối đa
          <input
            type="number"
            min={0}
            max={20}
            value={maxReoffers}
            onChange={(e) => setMaxReoffers(e.target.value)}
            disabled={sla.isPending || save.isPending}
            className={INPUT_CLASSES}
          />
        </label>
        <label className="flex flex-col gap-1.5 text-xs font-semibold text-zinc-700 dark:text-zinc-300">
          Số thợ mỗi lượt
          <input
            type="number"
            min={5}
            max={50}
            value={candidateLimit}
            onChange={(e) => setCandidateLimit(e.target.value)}
            disabled={sla.isPending || save.isPending}
            className={INPUT_CLASSES}
          />
        </label>
      </div>
      <button
        type="button"
        onClick={handleSave}
        disabled={save.isPending}
        className="mt-3 flex min-h-[44px] items-center gap-1.5 rounded-xl bg-zinc-900 px-5 py-2 text-sm font-semibold text-white transition-colors duration-200 hover:bg-zinc-700 disabled:opacity-60 motion-safe:active:scale-[0.99] dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
      >
        <FiSave aria-hidden="true" className="h-4 w-4" />
        {save.isPending ? "Đang lưu…" : "Lưu cấu hình"}
      </button>
    </section>
  );
}
