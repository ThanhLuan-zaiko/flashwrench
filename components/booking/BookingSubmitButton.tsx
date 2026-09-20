import { FiCalendar, FiLoader } from "react-icons/fi";

type BookingSubmitButtonProps = {
  pending: boolean;
};

// Submit stays last in the details column: bottom of the stacked flow on
// mobile, bottom of the right-hand column on desktop.
export function BookingSubmitButton({ pending }: BookingSubmitButtonProps) {
  return (
    <button
      type="submit"
      disabled={pending}
      className="flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white transition-colors duration-200 hover:bg-zinc-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 motion-safe:active:scale-[0.99] dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200 dark:focus-visible:ring-offset-zinc-950"
    >
      {pending ? (
        <FiLoader
          aria-hidden="true"
          className="h-4 w-4 motion-safe:animate-spin"
        />
      ) : (
        <FiCalendar aria-hidden="true" className="h-4 w-4" />
      )}
      {pending ? "Đang tạo lịch hẹn…" : "Xác nhận đặt lịch"}
    </button>
  );
}
