import { FiCalendar, FiLoader } from "react-icons/fi";

type BookingSubmitButtonProps = {
  pending: boolean;
  disabled?: boolean;
  serviceCount?: number;
};

// Confirm action closing the summary aside: end of the stacked flow on
// mobile, pinned with the totals on desktop.
export function BookingSubmitButton({
  pending,
  disabled,
  serviceCount = 1,
}: BookingSubmitButtonProps) {
  return (
    <button
      type="submit"
      disabled={pending || disabled}
      className="inline-flex min-h-[44px] items-center justify-center gap-2 self-start rounded-xl px-4 py-2.5 text-sm font-semibold motion-safe:transition-colors motion-safe:duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#111111] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 motion-safe:active:scale-[0.99] dark:focus-visible:ring-offset-zinc-950 bg-[#1D4ED8] text-white hover:bg-[#1E40AF] dark:bg-[#60A5FA] dark:text-[#111111] dark:hover:bg-[#93C5FD]"
    >
      {pending ? (
        <FiLoader
          aria-hidden="true"
          className="h-4 w-4 motion-safe:animate-spin"
        />
      ) : (
        <FiCalendar aria-hidden="true" className="h-4 w-4" />
      )}
      {pending
        ? "Đang tạo lịch hẹn…"
        : serviceCount > 1
          ? `Xác nhận ${serviceCount} dịch vụ trong một lịch hẹn`
          : "Xác nhận đặt lịch"}
    </button>
  );
}
