"use client";

import type {
  FulfillmentType,
  OrderFieldErrors,
} from "@/lib/orders/orders.types";
import { CHECKOUT_SECTION_TITLE, checkoutOptionClasses } from "./checkout-ui";

type CheckoutFulfillmentFieldsProps = {
  fulfillment: FulfillmentType;
  errors: OrderFieldErrors;
  disabled: boolean;
  onFulfillment: (value: FulfillmentType) => void;
};

const FULFILLMENT_OPTIONS: {
  value: FulfillmentType;
  label: string;
  hint: string;
}[] = [
  { value: "delivery", label: "Giao tận nơi", hint: "Thợ mang tới địa chỉ" },
  { value: "pickup", label: "Nhận tại xưởng", hint: "Ghé lấy khi tiện" },
];

// Delivery-vs-pickup picker as two side-by-side option cards. The address
// and map pin for delivery live in CheckoutAddressFields.
export function CheckoutFulfillmentFields({
  fulfillment,
  errors,
  disabled,
  onFulfillment,
}: CheckoutFulfillmentFieldsProps) {
  return (
    <fieldset className="flex flex-col gap-2.5">
      <legend className={`mb-2.5 ${CHECKOUT_SECTION_TITLE}`}>Nhận hàng</legend>
      <div className="grid grid-cols-2 gap-2">
        {FULFILLMENT_OPTIONS.map((option) => {
          const active = fulfillment === option.value;
          return (
            <button
              key={option.value}
              type="button"
              disabled={disabled}
              onClick={() => onFulfillment(option.value)}
              aria-pressed={active}
              className={`flex min-h-[52px] flex-col items-start justify-center rounded-xl px-3 py-2 text-left ${checkoutOptionClasses(active)}`}
            >
              <span className="text-[13px] font-bold">{option.label}</span>
              <span className="mt-0.5 text-[11px] text-zinc-500 dark:text-zinc-400">
                {option.hint}
              </span>
            </button>
          );
        })}
      </div>
      {errors.fulfillment && (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {errors.fulfillment}
        </p>
      )}
    </fieldset>
  );
}
