"use client";

import { useEffect, useState } from "react";
import { FiSave } from "react-icons/fi";
import { useToast } from "@/components/toast/useToast";
import {
  useAdminBookingConfig,
  useBookingConfigMutation,
} from "@/hooks/booking-config";
import {
  CANCEL_CUTOFF_HOURS_MAX,
  CANCEL_CUTOFF_HOURS_MIN,
  MAX_ADVANCE_DAYS_MAX,
  MAX_ADVANCE_DAYS_MIN,
  MIN_LEAD_DAYS_MAX,
  MIN_LEAD_DAYS_MIN,
} from "@/lib/booking/booking-config.types";
import { BookingConfigApiError } from "@/services/booking-config.api";

const INPUT_CLASSES =
  "min-h-[44px] w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50";

// Booking intake window: how far ahead a customer must schedule, how far
// out they may reach, and when self-serve cancel closes. 0 disables the
// two optional bounds so the shop keeps today's any-future-slot rule.
export function BookingPolicyCard() {
  const toast = useToast();
  const config = useAdminBookingConfig();
  const save = useBookingConfigMutation();
  const [leadDays, setLeadDays] = useState("2");
  const [advanceDays, setAdvanceDays] = useState("0");
  const [cutoffHours, setCutoffHours] = useState("0");
  const [guestEnabled, setGuestEnabled] = useState(true);
  const [loaded, setLoaded] = useState(false);

  const current = config.data?.config;
  useEffect(() => {
    if (current && !loaded) {
      setLeadDays(String(current.minLeadDays));
      setAdvanceDays(String(current.maxAdvanceDays));
      setCutoffHours(String(current.cancelCutoffHours));
      setGuestEnabled(current.guestBookingEnabled);
      setLoaded(true);
    }
  }, [current, loaded]);

  function handleSave() {
    save.mutate(
      {
        minLeadDays: Number(leadDays),
        maxAdvanceDays: Number(advanceDays),
        cancelCutoffHours: Number(cutoffHours),
        guestBookingEnabled: guestEnabled,
      },
      {
        onSuccess: () =>
          toast.success("Đã lưu cấu hình", "Áp dụng ngay cho lịch hẹn mới."),
        onError: (error) => {
          const message =
            error instanceof BookingConfigApiError
              ? (error.errors.minLeadDays ??
                error.errors.maxAdvanceDays ??
                error.errors.cancelCutoffHours ??
                error.errors.guestBookingEnabled ??
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
      aria-label="Cấu hình đặt lịch"
      data-reveal
      className="rounded-2xl border border-zinc-200 bg-white p-4 md:p-5 dark:border-zinc-800 dark:bg-zinc-950"
    >
      <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
        Chính sách đặt lịch
      </h2>
      <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
        {current?.isDefault === false
          ? "Đã tùy chỉnh — áp dụng ngay cho khách đang mở form đặt lịch."
          : "Đang dùng mặc định (đặt trước 2 ngày)."}
      </p>
      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5 text-xs font-semibold text-zinc-700 dark:text-zinc-300">
          Đặt trước tối thiểu (ngày)
          <input
            type="number"
            min={MIN_LEAD_DAYS_MIN}
            max={MIN_LEAD_DAYS_MAX}
            value={leadDays}
            onChange={(e) => setLeadDays(e.target.value)}
            disabled={busy}
            className={INPUT_CLASSES}
          />
        </label>
        <label className="flex flex-col gap-1.5 text-xs font-semibold text-zinc-700 dark:text-zinc-300">
          Đặt xa tối đa (ngày)
          <input
            type="number"
            min={MAX_ADVANCE_DAYS_MIN}
            max={MAX_ADVANCE_DAYS_MAX}
            value={advanceDays}
            onChange={(e) => setAdvanceDays(e.target.value)}
            disabled={busy}
            className={INPUT_CLASSES}
          />
        </label>
        <label className="flex flex-col gap-1.5 text-xs font-semibold text-zinc-700 dark:text-zinc-300">
          Hạn tự hủy của khách (giờ trước hẹn)
          <input
            type="number"
            min={CANCEL_CUTOFF_HOURS_MIN}
            max={CANCEL_CUTOFF_HOURS_MAX}
            value={cutoffHours}
            onChange={(e) => setCutoffHours(e.target.value)}
            disabled={busy}
            className={INPUT_CLASSES}
          />
        </label>
        <p className="self-end text-xs text-zinc-500 dark:text-zinc-400">
          Nhân lực dồi dào có thể hạ tối thiểu xuống 0–1 ngày; thiếu thợ thì
          tăng lên. Hai ô kia để 0 nghĩa là không giới hạn.
        </p>
      </div>
      <label className="mt-3 flex min-h-[44px] cursor-pointer items-center gap-3 rounded-xl border border-zinc-200 px-3 py-2 text-sm text-zinc-800 transition-colors duration-200 hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-900">
        <input
          type="checkbox"
          checked={guestEnabled}
          onChange={(e) => setGuestEnabled(e.target.checked)}
          disabled={busy}
          className="h-4 w-4 accent-zinc-900 dark:accent-zinc-100"
        />
        <span>
          <span className="block font-semibold">
            Cho phép khách đặt lịch không cần tài khoản
          </span>
          <span className="block text-xs text-zinc-500 dark:text-zinc-400">
            Tắt thì khách phải đăng nhập trước khi gửi form đặt lịch.
          </span>
        </span>
      </label>
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
