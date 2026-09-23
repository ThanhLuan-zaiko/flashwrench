"use client";

import { FiMapPin, FiTruck } from "react-icons/fi";
import { BookingMapSection } from "@/components/booking/BookingMapSection";
import type {
  FulfillmentType,
  OrderFieldErrors,
} from "@/lib/orders/orders.types";
import type { MapAddressValues } from "@/services/geocode.api";

type CheckoutFulfillmentFieldsProps = {
  fieldId: string;
  fulfillment: FulfillmentType;
  address: string;
  addressLat: number | null;
  addressLng: number | null;
  errors: OrderFieldErrors;
  disabled: boolean;
  onFulfillment: (value: FulfillmentType) => void;
  onAddress: (value: string) => void;
  onCoords: (lat: number, lng: number) => void;
  onGeocode: (values: MapAddressValues) => void;
};

const FULFILLMENT_OPTIONS: {
  value: FulfillmentType;
  label: string;
  hint: string;
}[] = [
  {
    value: "delivery",
    label: "Giao tận nơi",
    hint: "Thợ hoặc đơn vị vận chuyển giao tới địa chỉ của bạn",
  },
  {
    value: "pickup",
    label: "Nhận tại xưởng",
    hint: "Đến xưởng nhận hàng, miễn phí giao",
  },
];

// Delivery-vs-pickup picker plus the address + map pin the courier will
// navigate to. Pickup orders skip both and pay no shipping fee.
export function CheckoutFulfillmentFields({
  fieldId,
  fulfillment,
  address,
  addressLat,
  addressLng,
  errors,
  disabled,
  onFulfillment,
  onAddress,
  onCoords,
  onGeocode,
}: CheckoutFulfillmentFieldsProps) {
  return (
    <fieldset className="flex flex-col gap-3">
      <legend className="mb-1.5 text-sm font-medium text-zinc-800 dark:text-zinc-200">
        Hình thức nhận hàng
      </legend>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {FULFILLMENT_OPTIONS.map((option) => {
          const active = fulfillment === option.value;
          const Icon = option.value === "delivery" ? FiTruck : FiMapPin;
          return (
            <button
              key={option.value}
              type="button"
              disabled={disabled}
              onClick={() => onFulfillment(option.value)}
              aria-pressed={active}
              className={`flex min-h-[44px] items-start gap-2.5 rounded-xl border px-3.5 py-3 text-left transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 disabled:opacity-60 motion-safe:active:scale-[0.99] ${
                active
                  ? "border-zinc-900 bg-zinc-900 text-white dark:border-white dark:bg-white dark:text-zinc-900"
                  : "border-zinc-300 text-zinc-800 hover:border-zinc-400 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-900"
              }`}
            >
              <Icon aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
              <span className="flex flex-col">
                <span className="text-sm font-semibold">{option.label}</span>
                <span
                  className={`mt-0.5 text-xs ${
                    active
                      ? "text-zinc-300 dark:text-zinc-600"
                      : "text-zinc-500 dark:text-zinc-400"
                  }`}
                >
                  {option.hint}
                </span>
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

      {fulfillment === "delivery" && (
        <>
          <div>
            <label
              htmlFor={`${fieldId}-address`}
              className="mb-1.5 block text-sm font-medium text-zinc-800 dark:text-zinc-200"
            >
              Địa chỉ giao hàng
            </label>
            <textarea
              id={`${fieldId}-address`}
              value={address}
              onChange={(event) => onAddress(event.target.value)}
              placeholder="Số nhà, đường, phường/xã, quận/huyện, tỉnh/thành"
              rows={3}
              disabled={disabled}
              aria-invalid={Boolean(errors.address)}
              aria-describedby={
                errors.address ? `${fieldId}-address-error` : undefined
              }
              className={`w-full rounded-lg border bg-white px-3.5 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-zinc-900 dark:text-zinc-50 dark:placeholder:text-zinc-500 dark:focus-visible:ring-offset-zinc-950 ${
                errors.address
                  ? "border-red-500 dark:border-red-400"
                  : "border-zinc-300 hover:border-zinc-400 dark:border-zinc-700 dark:hover:border-zinc-600"
              }`}
            />
            {errors.address && (
              <p
                id={`${fieldId}-address-error`}
                role="alert"
                className="mt-1.5 text-sm text-red-600 dark:text-red-400"
              >
                {errors.address}
              </p>
            )}
          </div>
          <BookingMapSection
            lat={addressLat}
            lng={addressLng}
            labels={{
              title: "Vị trí giao hàng trên bản đồ",
              searchPlaceholder: "Tìm địa chỉ giao hàng…",
              emptyHint:
                "Chạm lên bản đồ để ghim điểm giao, hoặc tìm địa chỉ ở trên.",
            }}
            onCoords={(point) => onCoords(point.lat, point.lng)}
            onAddress={onGeocode}
          />
        </>
      )}
    </fieldset>
  );
}
