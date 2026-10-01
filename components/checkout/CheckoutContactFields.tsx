"use client";

import Link from "next/link";
import { AuthTextField } from "@/components/auth/AuthTextField";
import { buildLoginHref } from "@/lib/auth/auth-redirect";
import type { OrderFieldErrors } from "@/lib/orders/orders.types";

type CheckoutContactFieldsProps = {
  fieldId: string;
  guest: boolean;
  recipientName: string;
  phone: string;
  email: string;
  errors: OrderFieldErrors;
  disabled: boolean;
  onName?: (value: string) => void;
  onPhone?: (value: string) => void;
  onEmail?: (value: string) => void;
};

// Recipient contact block. Signed-in customers see their verified
// account details read-only; guests type the name/phone/email trio
// themselves — it lands on the order snapshot only.
export function CheckoutContactFields({
  fieldId,
  guest,
  recipientName,
  phone,
  email,
  errors,
  disabled,
  onName,
  onPhone,
  onEmail,
}: CheckoutContactFieldsProps) {
  return (
    <>
      {guest ? (
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Mua không cần tài khoản — chỉ cần thông tin liên hệ bên dưới.{" "}
          <Link
            href={buildLoginHref("/checkout")}
            className="font-semibold text-zinc-700 underline decoration-zinc-300 underline-offset-2 transition-colors duration-200 hover:text-zinc-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 dark:text-zinc-300 dark:decoration-zinc-600 dark:hover:text-zinc-100"
          >
            Đã có tài khoản? Đăng nhập
          </Link>{" "}
          để lưu lịch sử đơn hàng.
        </p>
      ) : (
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Tên người nhận và số điện thoại được lấy từ tài khoản của bạn.
        </p>
      )}
      <AuthTextField
        id={`${fieldId}-name`}
        label="Tên người nhận"
        value={recipientName}
        autoComplete="name"
        error={errors.recipientName}
        disabled={disabled}
        readOnly={!guest}
        onChange={guest ? onName : undefined}
      />
      <AuthTextField
        id={`${fieldId}-phone`}
        label="Số điện thoại"
        type="tel"
        inputMode="tel"
        value={phone}
        autoComplete="tel"
        error={errors.phone}
        disabled={disabled}
        readOnly={!guest}
        onChange={guest ? onPhone : undefined}
      />
      {guest && (
        <AuthTextField
          id={`${fieldId}-email`}
          label="Email"
          type="email"
          inputMode="email"
          value={email}
          autoComplete="email"
          error={errors.email}
          disabled={disabled}
          onChange={onEmail}
        />
      )}
    </>
  );
}
