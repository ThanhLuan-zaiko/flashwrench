"use client";

import { useId } from "react";
import { FiLoader, FiRefreshCw, FiTool, FiTruck } from "react-icons/fi";
import { SelectDropdown } from "@/app/admin/components/services/SelectDropdown";
import { useAvailableMechanics } from "@/hooks/booking";
import type { CourierType, OrderFieldErrors } from "@/lib/orders/orders.types";
import { generateTrackingCode } from "@/lib/orders/tracking-code";

export type CourierDraft = {
  type: CourierType;
  mechanicId: string;
  carrierName: string;
  trackingCode: string;
};

export const EMPTY_COURIER_DRAFT: CourierDraft = {
  type: "mechanic",
  mechanicId: "",
  carrierName: "",
  trackingCode: "",
};

type OrderCourierFieldsProps = {
  orderId: string;
  draft: CourierDraft;
  errors: OrderFieldErrors;
  disabled: boolean;
  onChange: (patch: Partial<CourierDraft>) => void;
};

// Courier assignment inside the ops dialog: the dispatcher picks an
// in-house mechanic (live GPS for the customer) or a third-party
// carrier identified by name + tracking code. The tracking code is
// auto-generated from the order id — staff only edits it when the
// carrier gave them a real one.
export function OrderCourierFields({
  orderId,
  draft,
  errors,
  disabled,
  onChange,
}: OrderCourierFieldsProps) {
  const fieldId = useId();
  const mechanics = useAvailableMechanics({ limit: 50 });
  const options = (mechanics.data?.mechanics ?? []).map((mechanic) => ({
    value: mechanic.id,
    label: mechanic.isOnline
      ? mechanic.displayName
      : `${mechanic.displayName} (ngoại tuyến)`,
  }));

  return (
    <section aria-label="Đơn vị giao hàng" className="flex flex-col gap-2">
      <h3 className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
        Đơn vị giao hàng
      </h3>
      <div className="grid grid-cols-2 gap-2">
        {(
          [
            { value: "mechanic", label: "Thợ giao", Icon: FiTool },
            { value: "third_party", label: "Bên thứ ba", Icon: FiTruck },
          ] as const
        ).map(({ value, label, Icon }) => {
          const active = draft.type === value;
          return (
            <button
              key={value}
              type="button"
              disabled={disabled}
              onClick={() =>
                onChange(
                  value === "third_party" && !draft.trackingCode
                    ? {
                        type: value,
                        trackingCode: generateTrackingCode(orderId),
                      }
                    : { type: value },
                )
              }
              aria-pressed={active}
              className={`flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl border px-3 py-2 text-sm font-semibold transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 disabled:opacity-60 motion-safe:active:scale-[0.98] ${
                active
                  ? "border-zinc-900 bg-zinc-900 text-white dark:border-white dark:bg-white dark:text-zinc-900"
                  : "border-zinc-300 text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
              }`}
            >
              <Icon aria-hidden="true" className="h-4 w-4" />
              {label}
            </button>
          );
        })}
      </div>
      {errors.courier && (
        <p role="alert" className="text-xs text-red-600 dark:text-red-400">
          {errors.courier}
        </p>
      )}

      {draft.type === "mechanic" && (
        <div>
          {mechanics.isPending ? (
            <p className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
              <FiLoader
                aria-hidden="true"
                className="h-3.5 w-3.5 motion-safe:animate-spin"
              />
              Đang tải danh sách thợ…
            </p>
          ) : (
            <SelectDropdown
              label="Thợ giao hàng"
              value={draft.mechanicId}
              options={options}
              onChange={(mechanicId) => onChange({ mechanicId })}
              placeholder="Chọn thợ giao hàng"
              searchPlaceholder="Tìm thợ…"
              emptyTitle="Chưa có thợ khả dụng"
            />
          )}
          {errors.mechanicId && (
            <p
              role="alert"
              className="mt-1 text-xs text-red-600 dark:text-red-400"
            >
              {errors.mechanicId}
            </p>
          )}
        </div>
      )}

      {draft.type === "third_party" && (
        <div className="flex flex-col gap-2">
          <input
            id={`${fieldId}-carrier`}
            value={draft.carrierName}
            onChange={(event) => onChange({ carrierName: event.target.value })}
            placeholder="Tên đơn vị vận chuyển (GHN, GHTK…)"
            aria-label="Tên đơn vị vận chuyển"
            disabled={disabled}
            className="h-11 w-full rounded-xl border border-zinc-300 bg-white px-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
          />
          {errors.carrierName && (
            <p role="alert" className="text-xs text-red-600 dark:text-red-400">
              {errors.carrierName}
            </p>
          )}
          <div className="flex gap-2">
            <input
              id={`${fieldId}-tracking`}
              value={draft.trackingCode}
              onChange={(event) =>
                onChange({ trackingCode: event.target.value })
              }
              placeholder="Mã vận đơn"
              aria-label="Mã vận đơn"
              disabled={disabled}
              className="h-11 w-full rounded-xl border border-zinc-300 bg-white px-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
            />
            <button
              type="button"
              disabled={disabled}
              onClick={() =>
                onChange({ trackingCode: generateTrackingCode(orderId) })
              }
              aria-label="Tạo lại mã vận đơn"
              title="Tạo lại mã vận đơn"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-zinc-300 text-zinc-600 transition-colors duration-200 hover:bg-zinc-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 disabled:opacity-60 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              <FiRefreshCw aria-hidden="true" className="h-4 w-4" />
            </button>
          </div>
          {errors.trackingCode && (
            <p role="alert" className="text-xs text-red-600 dark:text-red-400">
              {errors.trackingCode}
            </p>
          )}
        </div>
      )}
    </section>
  );
}
