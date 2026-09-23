"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useId, useState } from "react";
import { AuthTextField } from "@/components/auth/AuthTextField";
import { FormAlert } from "@/components/auth/FormAlert";
import { BigTypeHeader } from "@/components/bento/BigTypeHeader";
import { useMe } from "@/hooks/auth";
import { useCart } from "@/hooks/cart";
import { useCheckout } from "@/hooks/orders";
import { useBentoReveal } from "@/hooks/useBentoReveal";
import { buildLoginHref } from "@/lib/auth/auth-redirect";
import type {
  FulfillmentType,
  OrderFieldErrors,
} from "@/lib/orders/orders.types";
import { AuthApiError } from "@/services/auth.api";
import type { MapAddressValues } from "@/services/geocode.api";
import { CheckoutFulfillmentFields } from "./CheckoutFulfillmentFields";
import { CheckoutSummary } from "./CheckoutSummary";

// Customer /checkout: shipping form plus an immutable summary of the
// cart being purchased. Submits once; the server snapshots prices and
// stock so the total here is the total charged.
export function CheckoutPage() {
  const rootRef = useBentoReveal<HTMLDivElement>();
  const router = useRouter();
  const me = useMe();
  const cart = useCart();
  const checkout = useCheckout();
  const fieldId = useId();

  const [recipientName, setRecipientName] = useState("");
  const [phone, setPhone] = useState("");
  const [fulfillment, setFulfillment] = useState<FulfillmentType>("delivery");
  const [address, setAddress] = useState("");
  const [addressLat, setAddressLat] = useState<number | null>(null);
  const [addressLng, setAddressLng] = useState<number | null>(null);
  const [addressParts, setAddressParts] = useState({
    province: "",
    district: "",
    ward: "",
    street: "",
  });
  const [note, setNote] = useState("");
  const [errors, setErrors] = useState<OrderFieldErrors>({});

  const cartView = cart.data?.cart ?? null;
  const submitting = checkout.isPending;

  const handleGeocode = (values: MapAddressValues) => {
    setAddress(values.address);
    setAddressParts({
      province: values.province,
      district: values.district,
      ward: values.ward,
      street: values.street,
    });
  };

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    setErrors({});
    checkout.mutate(
      {
        recipientName: recipientName.trim(),
        phone: phone.trim(),
        fulfillment,
        address: fulfillment === "delivery" ? address.trim() : "",
        addressLat: fulfillment === "delivery" ? addressLat : null,
        addressLng: fulfillment === "delivery" ? addressLng : null,
        province: addressParts.province,
        district: addressParts.district,
        ward: addressParts.ward,
        street: addressParts.street,
        note: note.trim() || undefined,
      },
      {
        onSuccess: (data) => {
          router.push(`/orders/${data.order.id}?placed=1`);
        },
        onError: (error) => {
          if (error instanceof AuthApiError) {
            setErrors(error.errors as OrderFieldErrors);
          } else {
            setErrors({ form: "Không đặt được đơn hàng. Vui lòng thử lại." });
          }
        },
      },
    );
  };

  return (
    <div ref={rootRef} className="flex flex-col gap-6 md:gap-8">
      <BigTypeHeader
        level={1}
        eyebrow="Đặt hàng"
        title="Thông tin nhận hàng."
        subtitle="Chọn giao tận nơi hoặc nhận tại xưởng — nhân viên sẽ xác nhận đơn trước khi đóng gói."
      />

      {me.isSuccess && me.data?.role !== "customer" && (
        <div
          data-reveal
          className="rounded-2xl border border-zinc-200 bg-white p-6 text-center dark:border-zinc-800 dark:bg-zinc-950"
        >
          <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            {me.data
              ? "Chỉ tài khoản khách hàng mới đặt được hàng"
              : "Đăng nhập để đặt hàng"}
          </p>
          <Link
            href={me.data ? "/products" : buildLoginHref("/checkout")}
            className="mx-auto mt-4 flex min-h-[44px] w-fit items-center justify-center gap-1.5 rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white transition-colors duration-200 hover:bg-zinc-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            {me.data ? "Quay lại cửa hàng" : "Đăng nhập"}
          </Link>
        </div>
      )}

      {me.data?.role === "customer" &&
        cartView &&
        cartView.items.length === 0 && (
          <div
            data-reveal
            className="rounded-2xl border border-zinc-200 bg-white p-6 text-center dark:border-zinc-800 dark:bg-zinc-950"
          >
            <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
              Giỏ hàng đang trống
            </p>
            <Link
              href="/products"
              className="mx-auto mt-4 flex min-h-[44px] w-fit items-center justify-center gap-1.5 rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white transition-colors duration-200 hover:bg-zinc-700 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              Xem sản phẩm
            </Link>
          </div>
        )}

      {me.data?.role === "customer" &&
        cartView &&
        cartView.items.length > 0 && (
          <form
            onSubmit={submit}
            className="grid grid-cols-1 gap-4 md:grid-cols-5 md:gap-6"
          >
            <div
              data-reveal
              className="flex flex-col gap-4 rounded-2xl border border-zinc-200 bg-white p-5 md:col-span-3 dark:border-zinc-800 dark:bg-zinc-950"
            >
              {errors.form && <FormAlert message={errors.form} />}
              <AuthTextField
                id={`${fieldId}-name`}
                label="Tên người nhận"
                value={recipientName}
                onChange={setRecipientName}
                placeholder="Nguyễn Văn A"
                autoComplete="name"
                error={errors.recipientName}
                disabled={submitting}
              />
              <AuthTextField
                id={`${fieldId}-phone`}
                label="Số điện thoại"
                type="tel"
                inputMode="tel"
                value={phone}
                onChange={setPhone}
                placeholder="0901234567"
                autoComplete="tel"
                error={errors.phone}
                disabled={submitting}
              />
              <CheckoutFulfillmentFields
                fieldId={fieldId}
                fulfillment={fulfillment}
                address={address}
                addressLat={addressLat}
                addressLng={addressLng}
                errors={errors}
                disabled={submitting}
                onFulfillment={setFulfillment}
                onAddress={setAddress}
                onCoords={(lat, lng) => {
                  setAddressLat(lat);
                  setAddressLng(lng);
                }}
                onGeocode={handleGeocode}
              />
              <div>
                <label
                  htmlFor={`${fieldId}-note`}
                  className="mb-1.5 block text-sm font-medium text-zinc-800 dark:text-zinc-200"
                >
                  Ghi chú (không bắt buộc)
                </label>
                <textarea
                  id={`${fieldId}-note`}
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  placeholder="Ví dụ: giao giờ hành chính, gọi trước khi đến"
                  rows={2}
                  disabled={submitting}
                  className="w-full rounded-lg border border-zinc-300 bg-white px-3.5 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 transition-colors duration-200 hover:border-zinc-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 dark:placeholder:text-zinc-500 dark:hover:border-zinc-600 dark:focus-visible:ring-offset-zinc-950"
                />
              </div>
            </div>

            <CheckoutSummary
              cart={cartView}
              fulfillment={fulfillment}
              submitting={submitting}
            />
          </form>
        )}
    </div>
  );
}
