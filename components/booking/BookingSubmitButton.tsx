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
      className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white motion-safe:transition-colors motion-safe:duration-200 hover:bg-zinc-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 motion-safe:active:scale-[0.99] dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200 dark:focus-visible:ring-offset-zinc-950"
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
