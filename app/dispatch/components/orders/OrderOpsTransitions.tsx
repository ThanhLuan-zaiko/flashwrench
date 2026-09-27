"use client";

import { useState } from "react";
import { FiLoader } from "react-icons/fi";
import type { OpsToast } from "@/components/orders/order-format";
import { ORDER_STATUS_LABELS } from "@/components/orders/order-format";
import { useUpdateDispatchOrderStatus } from "@/hooks/dispatch-orders";
import type { OrderDetail, OrderFieldErrors } from "@/lib/orders/orders.types";
import {
  type OrderStatus,
  orderTransitions,
  requiresAdminTransition,
} from "@/lib/orders/orders.types";
import { AuthApiError } from "@/services/auth.api";
import {
  type CourierDraft,
  EMPTY_COURIER_DRAFT,
  OrderCourierFields,
} from "./OrderCourierFields";

// On the review queue the verbs beat the status names: approving a
// request refunds the order, rejecting hands it back to delivered.
const ACTION_LABELS: Partial<Record<`${OrderStatus}:${OrderStatus}`, string>> =
  {
    "return_requested:refunded": "Duyệt hoàn tiền",
    "return_requested:delivered": "Từ chối trả hàng",
  };

function actionLabel(from: OrderStatus, next: OrderStatus): string {
  return ACTION_LABELS[`${from}:${next}`] ?? ORDER_STATUS_LABELS[next];
}

type OrderOpsTransitionsProps = {
  order: OrderDetail;
  isAdmin: boolean;
  onToast: OpsToast;
};

// Status transition controls for the ops dialog: internal note, courier
// assignment when shipping out, and the legal next-step buttons (admin
// gates and the reject-reason requirement are also enforced server-side).
export function OrderOpsTransitions({
  order,
  isAdmin,
  onToast,
}: OrderOpsTransitionsProps) {
  const updateStatus = useUpdateDispatchOrderStatus();
  const [note, setNote] = useState("");
  const [fieldErrors, setFieldErrors] = useState<OrderFieldErrors>({});
  const [courier, setCourier] = useState<CourierDraft>(EMPTY_COURIER_DRAFT);

  const transitions = (
    orderTransitions(order.fulfillmentType)[order.status] ?? []
  ).filter((next) => isAdmin || !requiresAdminTransition(order.status, next));
  const needsCourier =
    order.fulfillmentType === "delivery" && transitions.includes("shipping");
  const decidingReturn = order.status === "return_requested";

  if (transitions.length === 0) return null;

  const apply = (status: OrderStatus) => {
    setFieldErrors({});
    if (status === "delivered" && decidingReturn && !note.trim()) {
      setFieldErrors({ note: "Nhập lý do từ chối yêu cầu đổi trả." });
      return;
    }
    if (status === "cancelled" && !note.trim()) {
      setFieldErrors({
        note: "Nhập lý do hủy đơn — khách hàng sẽ thấy thông báo này.",
      });
      return;
    }
    updateStatus.mutate(
      {
        orderId: order.id,
        status,
        note: note.trim() || undefined,
        courier:
          status === "shipping"
            ? {
                type: courier.type,
                mechanicId: courier.mechanicId || undefined,
                carrierName: courier.carrierName || undefined,
                trackingCode: courier.trackingCode || undefined,
              }
            : undefined,
      },
      {
        onSuccess: () => {
          setNote("");
          onToast(
            "success",
            "Đã cập nhật đơn",
            `Đơn #${order.id.slice(0, 8)} → ${ORDER_STATUS_LABELS[status]}`,
          );
        },
        onError: (err) => {
          if (err instanceof AuthApiError) {
            const errors = err.errors as OrderFieldErrors;
            setFieldErrors(errors);
            if (!errors.note && errors.form) {
              onToast("error", "Không cập nhật được đơn", errors.form);
            }
          } else {
            onToast(
              "error",
              "Không cập nhật được đơn",
              err.message || "Vui lòng thử lại.",
            );
          }
        },
      },
    );
  };

  return (
    <section aria-label="Cập nhật trạng thái">
      <h3 className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
        Chuyển trạng thái
      </h3>
      <input
        value={note}
        onChange={(e) => {
          setNote(e.target.value);
          setFieldErrors((prev) => ({ ...prev, note: undefined }));
        }}
        placeholder={
          decidingReturn
            ? "Lý do duyệt / từ chối (bắt buộc khi từ chối)"
            : transitions.includes("cancelled")
              ? "Ghi chú (bắt buộc khi hủy đơn — khách sẽ thấy)"
              : "Ghi chú nội bộ (không bắt buộc)"
        }
        aria-label="Ghi chú cập nhật trạng thái"
        className="mt-2 h-11 w-full rounded-xl border border-zinc-300 bg-white px-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
      />
      {fieldErrors.note && (
        <p role="alert" className="mt-1 text-xs text-red-600 dark:text-red-400">
          {fieldErrors.note}
        </p>
      )}
      {needsCourier && (
        <div className="mt-3">
          <OrderCourierFields
            orderId={order.id}
            draft={courier}
            errors={fieldErrors}
            disabled={updateStatus.isPending}
            onChange={(patch) =>
              setCourier((current) => ({ ...current, ...patch }))
            }
          />
        </div>
      )}
      <div className="mt-2 flex flex-wrap gap-1.5">
        {transitions.map((next) => (
          <button
            key={next}
            type="button"
            disabled={updateStatus.isPending}
            onClick={() => apply(next)}
            className="flex min-h-[44px] items-center gap-1.5 rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white transition-colors duration-200 hover:bg-zinc-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 disabled:opacity-60 motion-safe:active:scale-[0.98] dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            {updateStatus.isPending && (
              <FiLoader
                aria-hidden="true"
                className="h-4 w-4 motion-safe:animate-spin"
              />
            )}
            {actionLabel(order.status, next)}
          </button>
        ))}
      </div>
      {fieldErrors.form && (
        <p role="alert" className="mt-2 text-xs text-red-600 dark:text-red-400">
          {fieldErrors.form}
        </p>
      )}
    </section>
  );
}
