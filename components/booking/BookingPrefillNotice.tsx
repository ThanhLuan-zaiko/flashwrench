import { FiRotateCcw } from "react-icons/fi";

type BookingPrefillNoticeProps = {
  onReset: () => void;
};

// Shown when the customer's last booking refilled the form: they edit
// any field in place, or wipe the saved snapshot and type fresh.
export function BookingPrefillNotice({ onReset }: BookingPrefillNoticeProps) {
  return (
    <div className="flex flex-col gap-2 rounded-xl border border-zinc-200 bg-zinc-50 px-3.5 py-3 sm:flex-row sm:items-center sm:justify-between dark:border-zinc-800 dark:bg-zinc-900">
      <p className="text-xs text-zinc-600 dark:text-zinc-300">
        Đã điền sẵn thông tin từ lần đặt trước — sửa lại nếu có thay đổi.
      </p>
      <button
        type="button"
        onClick={onReset}
        className="flex min-h-[44px] items-center justify-center gap-1.5 self-start rounded-xl border border-zinc-300 px-3 py-1.5 text-xs font-semibold text-zinc-700 transition-colors duration-200 hover:bg-zinc-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 motion-safe:active:scale-[0.99] sm:self-auto dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
      >
        <FiRotateCcw aria-hidden="true" className="h-3.5 w-3.5" />
        Nhập lại từ đầu
      </button>
    </div>
  );
}
