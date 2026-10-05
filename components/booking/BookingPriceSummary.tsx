import { formatDuration } from "@/app/admin/components/services/catalog-format";
import { FormAlert } from "@/components/auth/FormAlert";
import { VoucherCodeField } from "@/components/vouchers/VoucherCodeField";
import { VoucherTotals } from "@/components/vouchers/VoucherTotals";
import { WalletPicker } from "@/components/vouchers/WalletPicker";
import { buildBookingHref, buildLoginHref } from "@/lib/auth/auth-redirect";
import type { BookingServiceSelection } from "@/lib/booking/booking-service-selection";
import type { BookingFieldErrors } from "@/services/booking.api";
import { BookingSubmitButton } from "./BookingSubmitButton";

type BookingPriceSummaryProps = {
  serviceIds: readonly string[];
  selection: BookingServiceSelection;
  guest: boolean;
  walletId: string | null;
  voucherCode: string;
  errors: BookingFieldErrors;
  pending: boolean;
  onWallet: (walletId: string | null) => void;
  onVoucherCode: (value: string) => void;
};

// Checkout-style summary aside, mirroring CheckoutSummary on /checkout:
// running totals, the voucher picker and the confirm button in one card
// that pins on `lg`. It is the only item in its grid column, so the
// sticky pin can never slide it over another block. On mobile it lands
// last, closing the stacked steps.
export function BookingPriceSummary({
  serviceIds,
  selection,
  guest,
  walletId,
  voucherCode,
  errors,
  pending,
  onWallet,
  onVoucherCode,
}: BookingPriceSummaryProps) {
  const count = serviceIds.length;
  const ready = count > 0 && selection.issue === null;
  const unitPricing = selection.services.some(
    (service) => service.priceUnit !== "per_job",
  );
  const hasErrors = Object.values(errors).some(Boolean);

  return (
    <aside
      aria-label="Tóm tắt lịch hẹn"
      className="flex min-w-0 flex-col gap-4 rounded-2xl border border-zinc-200 bg-white p-4 md:p-5 lg:sticky lg:top-20 dark:border-zinc-800 dark:bg-zinc-950"
    >
      <div>
        <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-50">
          Tóm tắt lịch hẹn
        </h2>
        <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
          {ready
            ? `${count} dịch vụ · Khoảng ${formatDuration(selection.durationMin)}`
            : count === 0
              ? "Chọn ít nhất một dịch vụ ở bước 1 để xem tạm tính."
              : "Hãy xử lý cảnh báo ở bước 1 để xem tạm tính."}
        </p>
      </div>
      {ready &&
        (guest ? (
          <div className="flex flex-col gap-3">
            <VoucherCodeField
              kind="booking"
              subtotal={selection.subtotal}
              value={voucherCode}
              onValueChange={onVoucherCode}
              disabled={pending}
              loginHref={buildLoginHref(buildBookingHref(serviceIds))}
              onApplied={() => undefined}
            />
            <VoucherTotals subtotal={selection.subtotal} discount={0} />
          </div>
        ) : (
          <WalletPicker
            kind="booking"
            subtotal={selection.subtotal}
            value={walletId}
            error={errors.walletId}
            disabled={pending}
            showTotals
            onChange={onWallet}
            codeSlot={
              <VoucherCodeField
                kind="booking"
                subtotal={selection.subtotal}
                value={voucherCode}
                onValueChange={onVoucherCode}
                disabled={pending}
                onApplied={(wallet) => onWallet(wallet.id)}
              />
            }
          />
        ))}
      {ready && (
        <p className="text-[11px] leading-relaxed text-zinc-500 dark:text-zinc-400">
          Phụ tùng phát sinh và phí di chuyển được xác nhận riêng cho cả lịch
          hẹn.
          {unitPricing &&
            " Dịch vụ tính theo giờ hoặc theo mục đang tạm tính cho 1 đơn vị."}
        </p>
      )}
      {hasErrors && (
        <FormAlert
          message={
            errors.form ?? "Vui lòng kiểm tra lại các ô được đánh dấu đỏ."
          }
        />
      )}
      <BookingSubmitButton
        pending={pending}
        disabled={!ready}
        serviceCount={count}
      />
    </aside>
  );
}
