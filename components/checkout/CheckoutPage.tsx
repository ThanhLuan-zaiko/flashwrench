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
import type { OrderFieldErrors } from "@/lib/orders/orders.types";
import { AuthApiError } from "@/services/auth.api";
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
  const [address, setAddress] = useState("");
  const [note, setNote] = useState("");
  const [errors, setErrors] = useState<OrderFieldErrors>({});

  const cartView = cart.data?.cart ?? null;
  const submitting = checkout.isPending;

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    setErrors({});
    checkout.mutate(
      {
        recipientName: recipientName.trim(),
        phone: phone.trim(),
        address: address.trim(),
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
        title="Thông tin giao hàng."
        subtitle="Nhân viên sẽ xác nhận đơn và phí giao hàng trước khi đóng gói."
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
                  onChange={(event) => setAddress(event.target.value)}
                  placeholder="Số nhà, đường, phường/xã, quận/huyện, tỉnh/thành"
                  rows={3}
                  disabled={submitting}
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

            <CheckoutSummary cart={cartView} submitting={submitting} />
          </form>
        )}
    </div>
  );
}
