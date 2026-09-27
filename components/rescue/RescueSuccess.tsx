"use client";

import { FiCheckCircle, FiPhone, FiRefreshCw } from "react-icons/fi";
import type { CreatedRescue } from "@/services/rescue.api";
import { RESCUE_HOTLINE, RESCUE_ISSUE_OPTIONS } from "./rescue-constants";

type RescueSuccessProps = {
  created: CreatedRescue;
  onNewRequest: () => void;
};

// Confirmation after 201: reassure the guest, repeat the hotline and
// the key facts dispatch will call back about. No tracking link yet.
export function RescueSuccess({ created, onNewRequest }: RescueSuccessProps) {
  const issueLabel =
    RESCUE_ISSUE_OPTIONS.find((o) => o.value === created.issueType)?.label ??
    created.issueType;
  return (
    <section
      aria-label="Yêu cầu cứu hộ đã gửi"
      data-reveal
      className="flex flex-col gap-4 rounded-2xl border border-zinc-200 bg-white p-4 md:p-5 dark:border-zinc-800 dark:bg-zinc-950"
    >
      <p className="flex items-center gap-2 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
        <FiCheckCircle aria-hidden="true" className="h-5 w-5 shrink-0" />
        Đã gửi yêu cầu cứu hộ
      </p>
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        Thợ trực sẽ gọi lại số {created.customerPhone} trong vài phút để xác
        nhận vị trí và báo giá. Giữ điện thoại bên mình và bật đèn cảnh báo.
      </p>
      <dl className="grid grid-cols-1 gap-2 rounded-xl bg-zinc-100 p-3 text-sm sm:grid-cols-2 dark:bg-zinc-900">
        <div>
          <dt className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
            Sự cố
          </dt>
          <dd className="font-semibold text-zinc-900 dark:text-zinc-50">
            {issueLabel}
          </dd>
        </div>
        <div>
          <dt className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
            Biển số
          </dt>
          <dd className="font-semibold text-zinc-900 dark:text-zinc-50">
            {created.vehiclePlate}
          </dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
            Vị trí xe
          </dt>
          <dd className="font-medium text-zinc-900 dark:text-zinc-50">
            {created.address}
          </dd>
        </div>
      </dl>
      <div className="flex flex-col gap-2 sm:flex-row">
        <a
          href={`tel:${RESCUE_HOTLINE.replace(/\s/g, "")}`}
          className="flex min-h-[44px] flex-1 items-center justify-center gap-1.5 rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white transition-colors duration-200 hover:bg-zinc-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 focus-visible:ring-offset-2 motion-safe:active:scale-[0.99] dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200 dark:focus-visible:ring-offset-zinc-950"
        >
          <FiPhone aria-hidden="true" className="h-4 w-4" />
          Gọi hotline {RESCUE_HOTLINE}
        </a>
        <button
          type="button"
          onClick={onNewRequest}
          className="flex min-h-[44px] flex-1 items-center justify-center gap-1.5 rounded-xl border border-zinc-300 px-4 py-2.5 text-sm font-semibold text-zinc-800 transition-colors duration-200 hover:bg-zinc-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 motion-safe:active:scale-[0.99] dark:border-zinc-700 dark:text-zinc-100 dark:hover:bg-zinc-900"
        >
          <FiRefreshCw aria-hidden="true" className="h-4 w-4" />
          Gửi yêu cầu khác
        </button>
      </div>
    </section>
  );
}
