"use client";

import { FiArrowLeft, FiMail } from "react-icons/fi";
import { AuthTextField } from "@/components/auth/AuthTextField";
import { FormAlert } from "@/components/auth/FormAlert";
import type { OtpSent } from "@/services/guest-access.api";

// Step 1 of the lookup: collect the address the visitor booked with. The
// submit button stays disabled until the address looks like an email so the
// request endpoint is only hit with something worth mailing.
type OtpRequestStepProps = {
  email: string;
  onEmail: (value: string) => void;
  onSubmit: () => void;
  pending: boolean;
  formError: string | null;
  fieldError: string | null;
};

const EMAIL_SHAPE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function OtpRequestStep({
  email,
  onEmail,
  onSubmit,
  pending,
  formError,
  fieldError,
}: OtpRequestStepProps) {
  const ready = EMAIL_SHAPE.test(email.trim());

  return (
    <form
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        if (ready && !pending) onSubmit();
      }}
      className="flex flex-col gap-4"
    >
      <div className="flex flex-col gap-1">
        <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
          Tra cứu dịch vụ đã dùng
        </h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Nhập đúng email bạn đã dùng khi đặt lịch, gọi cứu hộ hoặc mua linh
          kiện. Chúng tôi sẽ gửi mã xác minh 6 chữ số.
        </p>
      </div>

      {formError && <FormAlert message={formError} />}

      <AuthTextField
        id="guest-lookup-email"
        label="Email"
        type="email"
        value={email}
        onChange={onEmail}
        placeholder="ban@example.com"
        autoComplete="email"
        inputMode="email"
        error={fieldError ?? undefined}
        disabled={pending}
      />

      <button
        type="submit"
        disabled={!ready || pending}
        className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white transition-colors duration-200 hover:bg-zinc-700 focus-visible:ring-2 focus-visible:ring-zinc-500 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 motion-safe:active:scale-[0.99] dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200 dark:focus-visible:ring-offset-zinc-950"
      >
        <FiMail aria-hidden="true" className="h-4 w-4" />
        {pending ? "Đang gửi mã…" : "Gửi mã xác minh"}
      </button>
    </form>
  );
}

// Step 2: the six digits. Kept separate from the shell so the cooldown
// timer and the input can be re-rendered without touching the list below.
type OtpCodeStepProps = {
  sent: OtpSent;
  code: string;
  onCode: (value: string) => void;
  onSubmit: () => void;
  onResend: () => void;
  onBack: () => void;
  pending: boolean;
  resendPending: boolean;
  resendAfterSeconds: number;
  formError: string | null;
  codeError: string | null;
};

export function OtpCodeStep({
  sent,
  code,
  onCode,
  onSubmit,
  onResend,
  onBack,
  pending,
  resendPending,
  resendAfterSeconds,
  formError,
  codeError,
}: OtpCodeStepProps) {
  const ready = /^\d{6}$/.test(code);

  return (
    <form
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        if (ready && !pending) onSubmit();
      }}
      className="flex flex-col gap-4"
    >
      <div className="flex flex-col gap-1">
        <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
          Nhập mã xác minh
        </h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Mã 6 chữ số đã gửi tới{" "}
          <strong className="font-semibold text-zinc-700 dark:text-zinc-200">
            {sent.maskedEmail}
          </strong>
          . Mã hết hạn sau {Math.round(sent.expiresInSeconds / 60)} phút.
        </p>
      </div>

      {formError && <FormAlert message={formError} />}

      <AuthTextField
        id="guest-lookup-code"
        label="Mã xác minh"
        value={code}
        onChange={(value) => onCode(value.replace(/\D/g, "").slice(0, 6))}
        placeholder="000000"
        autoComplete="one-time-code"
        inputMode="text"
        error={codeError ?? undefined}
        disabled={pending}
      />

      <button
        type="submit"
        disabled={!ready || pending}
        className="inline-flex min-h-[44px] items-center justify-center rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white transition-colors duration-200 hover:bg-zinc-700 focus-visible:ring-2 focus-visible:ring-zinc-500 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 motion-safe:active:scale-[0.99] dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200 dark:focus-visible:ring-offset-zinc-950"
      >
        {pending ? "Đang xác minh…" : "Xác minh và xem dịch vụ"}
      </button>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          onClick={onBack}
          disabled={pending}
          className="inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-lg border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 transition-colors duration-200 hover:bg-zinc-100 focus-visible:ring-2 focus-visible:ring-zinc-500 focus-visible:outline-none disabled:opacity-50 motion-safe:active:scale-[0.99] dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-900"
        >
          <FiArrowLeft aria-hidden="true" className="h-4 w-4" />
          Đổi email
        </button>
        <button
          type="button"
          onClick={onResend}
          disabled={resendPending || resendAfterSeconds > 0}
          className="inline-flex min-h-[44px] items-center justify-center rounded-lg px-3 py-2 text-sm font-medium text-zinc-600 underline-offset-4 transition-colors duration-200 hover:text-zinc-900 hover:underline focus-visible:ring-2 focus-visible:ring-zinc-500 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 dark:text-zinc-300 dark:hover:text-zinc-50"
        >
          {resendPending
            ? "Đang gửi lại…"
            : resendAfterSeconds > 0
              ? `Gửi lại sau ${resendAfterSeconds}s`
              : "Gửi lại mã"}
        </button>
      </div>
    </form>
  );
}
