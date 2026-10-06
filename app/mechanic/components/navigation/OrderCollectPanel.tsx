"use client";

import { useId, useState } from "react";
import { FiLoader } from "react-icons/fi";
import { useToast } from "@/components/toast/useToast";
import { useDeliverOrder, useIssueOrderPaymentCode } from "@/hooks/mechanic";
import type { MechanicNavigationTarget } from "@/lib/mechanic/mechanic.types";
import { ConfirmCodeField } from "../ConfirmCodeField";
import { collectPaymentError, isValidConfirmCode } from "../collect-payment";
import { formatVnd } from "../mechanic-format";

type OrderCollectPanelProps = {
  target: MechanicNavigationTarget;
};

// Courier-COD block for delivery pins on the navigation board. "Gửi mã"
// pushes the confirm code onto the customer's screen (their payment banner
// pops wherever they are); the mechanic echoes the six digits here, which
// settles the order to delivered + paid in one request.
export function OrderCollectPanel({ target }: OrderCollectPanelProps) {
  const uid = useId();
  const toast = useToast();
  const issue = useIssueOrderPaymentCode();
  const deliver = useDeliverOrder();
  const [confirmCode, setConfirmCode] = useState("");
  const [error, setError] = useState("");
  const issued = target.codeIssued || issue.isSuccess;
  const pending = deliver.isPending;

  const onIssue = () => {
    setError("");
    issue.mutate(target.bookingId, {
      onSuccess: () =>
        toast.success(
          "Đã gửi mã cho khách",
          "Xin khách đọc 6 số hiện trên màn hình của họ.",
        ),
      onError: (err) => setError(collectPaymentError(err)),
    });
  };

  const onDeliver = () => {
    if (!isValidConfirmCode(confirmCode)) return;
    setError("");
    deliver.mutate(
      {
        orderId: target.bookingId,
        confirmCode: confirmCode.trim(),
      },
      {
        onSuccess: () => {
          setConfirmCode("");
          toast.success(
            "Đã giao và thu tiền",
            `Đã thu ${formatVnd(target.codAmount ?? 0)} từ khách.`,
          );
        },
        onError: (err) => setError(collectPaymentError(err)),
      },
    );
  };

  return (
    <div className="mt-3 rounded-2xl border border-zinc-200 p-3 dark:border-zinc-800">
      <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
        Thu tiền khi giao · {formatVnd(target.codAmount ?? 0)}
      </p>
      <ConfirmCodeField
        id={`${uid}-order-code`}
        value={confirmCode}
        disabled={pending}
        issuePending={issue.isPending}
        issued={issued}
        onChange={setConfirmCode}
        onIssue={onIssue}
      />
      {error && (
        <p
          role="alert"
          className="mt-2 text-xs font-medium text-red-600 dark:text-red-400"
        >
          {error}
        </p>
      )}
      <button
        type="button"
        onClick={onDeliver}
        disabled={pending || !isValidConfirmCode(confirmCode)}
        className="mt-3 flex min-h-[44px] w-full items-center justify-center gap-1.5 rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white transition-colors duration-200 hover:bg-zinc-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 disabled:opacity-60 motion-safe:active:scale-[0.99] dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
      >
        {pending && (
          <FiLoader
            aria-hidden="true"
            className="h-4 w-4 motion-safe:animate-spin"
          />
        )}
        Giao hàng & thu {formatVnd(target.codAmount ?? 0)}
      </button>
    </div>
  );
}
