import { FiUserCheck } from "react-icons/fi";
import type { RescueFieldErrors } from "@/services/rescue.api";
import { BookingField, BookingTextInput } from "../booking/BookingFormFields";
import type { RescueContactResolution } from "./rescue-form-state";

type RescueContactSectionProps = {
  fullName: string;
  phone: string;
  email: string;
  contact: RescueContactResolution;
  loading: boolean;
  errors: RescueFieldErrors;
  disabled: boolean;
  onFullName: (value: string) => void;
  onPhone: (value: string) => void;
  onEmail: (value: string) => void;
};

// Contact step: guests type name + phone + email; a signed-in account
// supplies them instead and the fields collapse to a read-only summary. A
// missing account piece (blank name, no phone) still renders its input.
// While the session resolves, a skeleton holds the row so the inputs
// never flash for a signed-in customer.
export function RescueContactSection({
  fullName,
  phone,
  email,
  contact,
  loading,
  errors,
  disabled,
  onFullName,
  onPhone,
  onEmail,
}: RescueContactSectionProps) {
  if (loading) {
    return (
      <div aria-busy="true" className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <p className="sr-only">Đang tải thông tin tài khoản</p>
        <div className="h-[84px] animate-pulse rounded-xl bg-zinc-100 dark:bg-zinc-900" />
        <div className="h-[84px] animate-pulse rounded-xl bg-zinc-100 dark:bg-zinc-900" />
      </div>
    );
  }

  const hasAccountContact =
    contact.accountName !== "" ||
    contact.accountPhone !== "" ||
    contact.accountEmail !== "";
  const showInputs =
    contact.showNameInput || contact.showPhoneInput || contact.showEmailInput;
  // Validation errors on hidden fields are account-sourced; surface the
  // first one under the summary card since no input can carry it.
  const hiddenFieldError =
    (contact.showNameInput ? undefined : errors.fullName) ??
    (contact.showPhoneInput ? undefined : errors.phone) ??
    (contact.showEmailInput ? undefined : errors.email);

  return (
    <div className="flex flex-col gap-4">
      {hasAccountContact && (
        <div className="flex flex-col gap-1.5">
          <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
            Thông tin liên hệ
          </p>
          <div className="flex items-center gap-3 rounded-xl border border-zinc-200 bg-zinc-100 px-3 py-2.5 dark:border-zinc-800 dark:bg-zinc-900">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-zinc-300 bg-white text-zinc-600 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-300">
              <FiUserCheck aria-hidden="true" className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                {contact.accountName || contact.accountPhone}
              </p>
              <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">
                {[contact.accountPhone, contact.accountEmail]
                  .filter(Boolean)
                  .join(" · ")}{" "}
                lấy từ tài khoản đã đăng nhập
              </p>
            </div>
          </div>
          {hiddenFieldError && (
            <p
              role="alert"
              className="text-[11px] font-medium text-red-600 dark:text-red-400"
            >
              {hiddenFieldError}
            </p>
          )}
        </div>
      )}

      {showInputs && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {contact.showNameInput && (
            <BookingField
              id="rescue-fullName"
              label="Họ và tên"
              required
              error={errors.fullName}
              hint="Tên người đang ở cùng xe."
            >
              <BookingTextInput
                id="rescue-fullName"
                value={fullName}
                onChange={onFullName}
                placeholder="Nguyễn Văn An"
                autoComplete="name"
                error={errors.fullName}
                disabled={disabled}
              />
            </BookingField>
          )}
          {contact.showPhoneInput && (
            <BookingField
              id="rescue-phone"
              label="Số điện thoại"
              required
              error={errors.phone}
              hint="Thợ gọi lại số này ngay sau khi nhận yêu cầu."
            >
              <BookingTextInput
                id="rescue-phone"
                value={phone}
                onChange={onPhone}
                placeholder="0912345678"
                autoComplete="tel"
                inputMode="tel"
                error={errors.phone}
                disabled={disabled}
              />
            </BookingField>
          )}
          {contact.showEmailInput && (
            <div className="sm:col-span-2">
              <BookingField
                id="rescue-email"
                label="Email"
                required
                error={errors.email}
                hint="Dùng để tra cứu yêu cầu và hóa đơn khi cần."
              >
                <BookingTextInput
                  id="rescue-email"
                  value={email}
                  onChange={onEmail}
                  placeholder="ban@example.com"
                  autoComplete="email"
                  inputMode="text"
                  error={errors.email}
                  disabled={disabled}
                />
              </BookingField>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
