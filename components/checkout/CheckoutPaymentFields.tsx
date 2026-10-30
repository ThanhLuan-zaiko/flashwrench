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
import { CHECKOUT_SECTION_TITLE, checkoutOptionClasses } from "./checkout-ui";

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
    <fieldset className="flex flex-col gap-2.5">
      <legend className={`mb-2.5 ${CHECKOUT_SECTION_TITLE}`}>Thanh toán</legend>
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
              className={`flex min-h-11 items-center gap-2.5 rounded-xl px-3 py-2 text-left ${checkoutOptionClasses(active)}`}
            >
              <span
                aria-hidden="true"
                className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${
                  active
                    ? "border-[#1E3A5F] dark:border-zinc-100"
                    : "border-zinc-400 dark:border-zinc-600"
                }`}
              >
                {active && (
                  <span className="h-2 w-2 rounded-full bg-[#1E3A5F] dark:bg-zinc-100" />
                )}
              </span>
              <Icon
                aria-hidden="true"
                className="hidden h-4 w-4 shrink-0 sm:block"
              />
              <span className="flex min-w-0 flex-col">
                <span className="text-[13px] font-semibold sm:text-sm">
                  {label}
                </span>
                <span className="mt-0.5 hidden text-xs text-zinc-500 sm:block dark:text-zinc-400">
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
