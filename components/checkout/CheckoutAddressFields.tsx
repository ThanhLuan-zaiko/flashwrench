"use client";

import { BookingMapSection } from "@/components/booking/BookingMapSection";
import type { OrderFieldErrors } from "@/lib/orders/orders.types";
import type { MapAddressValues } from "@/services/geocode.api";

type CheckoutAddressFieldsProps = {
  fieldId: string;
  address: string;
  addressLat: number | null;
  addressLng: number | null;
  errors: OrderFieldErrors;
  disabled: boolean;
  onAddress: (value: string) => void;
  onCoords: (lat: number, lng: number) => void;
  onGeocode: (values: MapAddressValues) => void;
};

// Delivery address plus the map pin the courier will navigate to. Only
// rendered for delivery orders; pickup skips both.
export function CheckoutAddressFields({
  fieldId,
  address,
  addressLat,
  addressLng,
  errors,
  disabled,
  onAddress,
  onCoords,
  onGeocode,
}: CheckoutAddressFieldsProps) {
  return (
    <div className="flex flex-col gap-3">
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
    </div>
  );
}
