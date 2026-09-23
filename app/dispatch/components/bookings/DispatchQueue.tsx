import { FiAlertCircle, FiLoader } from "react-icons/fi";
import type { BookingSummary } from "@/services/dispatch.api";
import { DispatchBookingCard } from "./DispatchBookingCard";

type DispatchQueueProps = {
  isPending: boolean;
  isError: boolean;
  filterLabel: string;
  items: BookingSummary[];
  selectedId?: string | null;
  onRetry: () => void;
  onSelect?: (bookingId: string) => void;
  onOpen: (bookingId: string) => void;
};

// Queue states: skeleton, retry, empty hint, or the paged rows.
export function DispatchQueue({
  isPending,
  isError,
  filterLabel,
  items,
  selectedId = null,
  onRetry,
  onSelect,
  onOpen,
}: DispatchQueueProps) {
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
        <span className="sr-only">Đang tải danh sách đơn</span>
      </div>
    );
  }
  if (isError) {
    return (
      <div className="mt-4 flex flex-col items-center py-8 text-center">
        <FiAlertCircle aria-hidden="true" className="h-10 w-10 text-zinc-400" />
        <p className="mt-3 text-sm font-semibold text-zinc-800 dark:text-zinc-200">
          Không tải được danh sách đơn
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
  if (items.length === 0) {
    return (
      <div className="mt-4 flex flex-col items-center py-8 text-center">
        <FiAlertCircle aria-hidden="true" className="h-10 w-10 text-zinc-400" />
        <p className="mt-3 text-sm font-semibold text-zinc-800 dark:text-zinc-200">
          Chưa có đơn nào
        </p>
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
          Không có đơn ở trạng thái “{filterLabel}” trong tháng này.
        </p>
      </div>
    );
  }
  return (
    <ul className="mt-4 divide-y divide-zinc-200 rounded-2xl border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
      {items.map((booking) => (
        <DispatchBookingCard
          key={booking.id}
          booking={booking}
          selected={booking.id === selectedId}
          onSelect={onSelect ? () => onSelect(booking.id) : undefined}
          onOpen={() => onOpen(booking.id)}
        />
      ))}
    </ul>
  );
}
