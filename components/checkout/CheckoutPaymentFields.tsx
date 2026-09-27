"use client";

import { FiCreditCard, FiDollarSign, FiHome } from "react-icons/fi";
import type {
  FulfillmentType,
  OrderFieldErrors,
} from "@/lib/orders/orders.types";
import {
  type OrderPaymentMethod,
  paymentMethodsFor,
} from "@/lib/payments/order-payment.types";

type CheckoutPaymentFieldsProps = {
  fulfillment: FulfillmentType;
  paymentMethod: OrderPaymentMethod;
  errors: OrderFieldErrors;
  disabled: boolean;
  onPaymentMethod: (value: OrderPaymentMethod) => void;
};

const METHOD_META: Record<
  OrderPaymentMethod,
  { label: string; hint: string; Icon: typeof FiCreditCard }
> = {
  cod: {
    label: "Thanh toán khi nhận hàng",
    hint: "Trả tiền cho nhân viên khi đơn được giao tới",
    Icon: FiDollarSign,
  },
  counter: {
    label: "Thanh toán tại quầy",
    hint: "Đến xưởng thanh toán trực tiếp tại quầy thu ngân",
    Icon: FiHome,
  },
  bank_transfer: {
    label: "Thanh toán online (giả lập)",
    hint: "Cổng thanh toán giả lập — xác nhận là đơn ghi nhận đã trả",
    Icon: FiCreditCard,
  },
};

// Payment method picker for checkout: the list depends on how the order
// is received (pickup orders can't pay a courier, so cod drops out).
export function CheckoutPaymentFields({
  fulfillment,
  paymentMethod,
  errors,
  disabled,
  onPaymentMethod,
}: CheckoutPaymentFieldsProps) {
  const options = paymentMethodsFor(fulfillment);
  return (
    <fieldset className="flex flex-col gap-3">
      <legend className="mb-1.5 text-sm font-medium text-zinc-800 dark:text-zinc-200">
        Phương thức thanh toán
      </legend>
      <div className="grid grid-cols-1 gap-2">
        {options.map((method) => {
          const active = paymentMethod === method;
          const { label, hint, Icon } = METHOD_META[method];
          return (
            <button
              key={method}
              type="button"
              disabled={disabled}
              onClick={() => onPaymentMethod(method)}
              aria-pressed={active}
              className={`flex min-h-[44px] items-start gap-2.5 rounded-xl border px-3.5 py-3 text-left transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 disabled:opacity-60 motion-safe:active:scale-[0.99] ${
                active
                  ? "border-zinc-900 bg-zinc-900 text-white dark:border-white dark:bg-white dark:text-zinc-900"
                  : "border-zinc-300 text-zinc-800 hover:border-zinc-400 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-900"
              }`}
            >
              <Icon aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
              <span className="flex flex-col">
                <span className="text-sm font-semibold">{label}</span>
                <span
                  className={`mt-0.5 text-xs ${
                    active
                      ? "text-zinc-300 dark:text-zinc-600"
                      : "text-zinc-500 dark:text-zinc-400"
                  }`}
                >
                  {hint}
                </span>
              </span>
            </button>
          );
        })}
      </div>
      {errors.paymentMethod && (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {errors.paymentMethod}
        </p>
      )}
    </fieldset>
  );
}
