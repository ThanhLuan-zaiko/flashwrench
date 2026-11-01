import { FiRotateCcw } from "react-icons/fi";

type BookingPrefillNoticeProps = {
  onReset: () => void;
};

// Shown when the customer's last booking refilled the form: they edit
// any field in place, or wipe the saved snapshot and type fresh.
export function BookingPrefillNotice({ onReset }: BookingPrefillNoticeProps) {
  return (
    <div className="flex flex-col gap-2 border-b border-zinc-200 pb-3 sm:flex-row sm:items-center sm:justify-between dark:border-zinc-800">
      <p className="text-xs text-zinc-600 dark:text-zinc-300">
        Đã điền sẵn thông tin từ lần đặt trước — sửa lại nếu có thay đổi.
      </p>
      <button
        type="button"
        onClick={onReset}
        className="flex min-h-11 items-center justify-center gap-1.5 self-start text-sm font-bold text-[#1E3A5F] underline-offset-4 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1E3A5F] motion-safe:active:scale-[0.99] sm:self-auto dark:text-zinc-100"
      >
        <FiRotateCcw aria-hidden="true" className="h-3.5 w-3.5" />
        Nhập lại từ đầu
      </button>
    </div>
  );
}
