import { FiAlertCircle, FiLoader } from "react-icons/fi";
import type { MechanicBookingSummary } from "@/services/mechanic.api";
import { BookingCard } from "./BookingCard";

type ScheduleBodyProps = {
  isPending: boolean;
  isError: boolean;
  filterLabel: string;
  visible: MechanicBookingSummary[];
  onRetry: () => void;
  onOpen: (bookingId: string) => void;
};

// Queue states: skeleton, retry, empty hint, or the paged rows.
export function ScheduleBody({
  isPending,
  isError,
  filterLabel,
  visible,
  onRetry,
  onOpen,
}: ScheduleBodyProps) {
  if (isPending) {
    return (
      <div
        className="mt-4 flex items-center justify-center py-8"
        aria-live="polite"
        aria-busy="true"
      >
        <FiLoader
          aria-hidden="true"
          className="h-8 w-8 text-zinc-400 motion-safe:animate-spin dark:text-zinc-500"
        />
        <span className="sr-only">Đang tải lịch làm việc</span>
      </div>
    );
  }
  if (isError) {
    return (
      <div className="mt-4 flex flex-col items-center py-8 text-center">
        <FiAlertCircle aria-hidden="true" className="h-10 w-10 text-zinc-400" />
        <p className="mt-3 text-sm font-semibold text-zinc-800 dark:text-zinc-200">
          Không tải được lịch làm việc
        </p>
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
          Kiểm tra kết nối rồi thử lại.
        </p>
        <button
          type="button"
          onClick={onRetry}
          className="mt-4 flex min-h-[44px] items-center rounded-xl border border-zinc-300 px-4 py-2 text-sm font-semibold text-zinc-700 transition-colors duration-200 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
        >
          Tải lại
        </button>
      </div>
    );
  }
  if (visible.length === 0) {
    return (
      <div className="mt-4 flex flex-col items-center py-8 text-center">
        <FiAlertCircle aria-hidden="true" className="h-10 w-10 text-zinc-400" />
        <p className="mt-3 text-sm font-semibold text-zinc-800 dark:text-zinc-200">
          Chưa có đơn nào
        </p>
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
          Không có đơn ở trạng thái “{filterLabel}”.
        </p>
      </div>
    );
  }
  return (
    <ul className="mt-4 divide-y divide-zinc-200 rounded-2xl border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
      {visible.map((booking) => (
        <BookingCard
          key={booking.id}
          booking={booking}
          onOpen={() => onOpen(booking.id)}
        />
      ))}
    </ul>
  );
}
