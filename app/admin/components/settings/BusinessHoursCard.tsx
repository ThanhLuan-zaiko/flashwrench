"use client";

import { useEffect, useState } from "react";
import { FiSave } from "react-icons/fi";
import { useToast } from "@/components/toast/useToast";
import {
  useAdminBusinessHours,
  useBusinessHoursMutation,
} from "@/hooks/shop-settings";
import {
  DEFAULT_BUSINESS_TIME_ZONE,
  formatMinutesOfDay,
} from "@/lib/shop/business-hours.types";
import { ShopSettingsApiError } from "@/services/shop-settings.api";

const INPUT_CLASSES =
  "min-h-[44px] w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50";

function parseHHmm(value: string): number | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(value.trim());
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  return hours * 60 + minutes;
}

// Daily working window in the shop zone. When enabled, booking intake
// rejects slots outside [opens, closes) — the server re-checks on
// submit either way.
export function BusinessHoursCard() {
  const toast = useToast();
  const config = useAdminBusinessHours();
  const save = useBusinessHoursMutation();
  const [enabled, setEnabled] = useState(false);
  const [opens, setOpens] = useState("07:00");
  const [closes, setCloses] = useState("20:00");
  const [loaded, setLoaded] = useState(false);

  const current = config.data?.hours;
  useEffect(() => {
    if (current && !loaded) {
      setEnabled(current.enabled);
      setOpens(formatMinutesOfDay(current.opensAtMin));
      setCloses(formatMinutesOfDay(current.closesAtMin));
      setLoaded(true);
    }
  }, [current, loaded]);

  function handleSave() {
    save.mutate(
      {
        enabled,
        opensAtMin: parseHHmm(opens) ?? -1,
        closesAtMin: parseHHmm(closes) ?? -1,
        timeZone: current?.timeZone ?? DEFAULT_BUSINESS_TIME_ZONE,
      },
      {
        onSuccess: () =>
          toast.success(
            "Đã lưu giờ làm việc",
            enabled
              ? "Khách chỉ đặt được trong khung giờ này."
              : "Khách đặt được mọi khung giờ trong ngày.",
          ),
        onError: (error) => {
          const message =
            error instanceof ShopSettingsApiError
              ? (error.errors.opensAtMin ??
                error.errors.closesAtMin ??
                error.errors.form ??
                "Vui lòng kiểm tra lại.")
              : "Vui lòng thử lại sau.";
          toast.error("Không lưu được", message);
        },
      },
    );
  }

  const busy = config.isPending || save.isPending;

  return (
    <section
      aria-label="Giờ làm việc"
      data-reveal
      className="rounded-2xl border border-zinc-200 bg-white p-4 md:p-5 dark:border-zinc-800 dark:bg-zinc-950"
    >
      <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
        Giờ làm việc
      </h2>
      <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
        {current?.isDefault === false
          ? "Đã tùy chỉnh — áp dụng ngay cho khung giờ đặt lịch."
          : "Chưa cấu hình — khách đặt được mọi khung giờ."}
      </p>
      <label className="mt-3 flex min-h-[44px] cursor-pointer items-center gap-3 rounded-xl border border-zinc-200 px-3 py-2 text-sm text-zinc-800 transition-colors duration-200 hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-900">
        <input
          type="checkbox"
          checked={enabled}
          onChange={(e) => setEnabled(e.target.checked)}
          disabled={busy}
          className="h-4 w-4 accent-zinc-900 dark:accent-zinc-100"
        />
        <span>
          <span className="block font-semibold">
            Giới hạn khung giờ đặt lịch
          </span>
          <span className="block text-xs text-zinc-500 dark:text-zinc-400">
            Khách chỉ chọn được giờ trong khung mở–đóng bên dưới.
          </span>
        </span>
      </label>
      <div className="mt-3 grid grid-cols-2 gap-3 sm:max-w-md">
        <label className="flex flex-col gap-1.5 text-xs font-semibold text-zinc-700 dark:text-zinc-300">
          Mở cửa
          <input
            type="time"
            value={opens}
            onChange={(e) => setOpens(e.target.value)}
            disabled={busy || !enabled}
            className={INPUT_CLASSES}
          />
        </label>
        <label className="flex flex-col gap-1.5 text-xs font-semibold text-zinc-700 dark:text-zinc-300">
          Đóng cửa
          <input
            type="time"
            value={closes}
            onChange={(e) => setCloses(e.target.value)}
            disabled={busy || !enabled}
            className={INPUT_CLASSES}
          />
        </label>
      </div>
      <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
        Múi giờ cửa hàng: {current?.timeZone ?? DEFAULT_BUSINESS_TIME_ZONE}. Giờ
        đóng cửa phải sau giờ mở cửa (không hỗ trợ ca qua đêm).
      </p>
      <button
        type="button"
        onClick={handleSave}
        disabled={save.isPending}
        className="mt-3 flex min-h-[44px] items-center gap-1.5 rounded-xl bg-zinc-900 px-5 py-2 text-sm font-semibold text-white transition-colors duration-200 hover:bg-zinc-700 disabled:opacity-60 motion-safe:active:scale-[0.99] dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
      >
        <FiSave aria-hidden="true" className="h-4 w-4" />
        {save.isPending ? "Đang lưu…" : "Lưu giờ làm việc"}
      </button>
    </section>
  );
}
