import Link from "next/link";
import { FiArrowRight, FiRefreshCw } from "react-icons/fi";

// Static skeleton ids keep React keys stable without array indexes.
const SKELETON_IDS = [
  "skeleton-1",
  "skeleton-2",
  "skeleton-3",
  "skeleton-4",
  "skeleton-5",
  "skeleton-6",
  "skeleton-7",
  "skeleton-8",
  "skeleton-9",
  "skeleton-10",
];

const TEXT_LINK =
  "flex min-h-11 items-center gap-1.5 text-sm font-bold text-[#1D4ED8] underline-offset-4 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-[#111111] dark:text-blue-300 dark:focus-visible:ring-zinc-100";

// Loading state: tile-shaped placeholders on the same grid as the results.
export function ProductsSkeleton() {
  return (
    <div
      aria-busy="true"
      className="grid grid-cols-2 gap-x-4 gap-y-8 lg:grid-cols-5"
    >
      <p className="sr-only">Đang tải sản phẩm</p>
      {SKELETON_IDS.map((skeletonId) => (
        <div
          key={skeletonId}
          className="aspect-[3/4] rounded-lg bg-zinc-100 motion-safe:animate-pulse dark:bg-zinc-900"
        />
      ))}
    </div>
  );
}

export function ProductsErrorNotice({ onRetry }: { onRetry: () => void }) {
  return (
    <div
      role="alert"
      className="flex flex-col gap-2 rounded-xl border border-red-300 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300"
    >
      <p className="font-semibold">Không tải được danh sách sản phẩm.</p>
      <p className="text-xs">Vui lòng kiểm tra mạng rồi thử lại.</p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-1 flex min-h-11 w-fit items-center gap-1.5 rounded-xl border border-red-600 px-4 py-2 text-sm font-semibold transition-colors duration-200 hover:bg-red-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 motion-safe:active:scale-[0.99] dark:border-red-800 dark:hover:bg-red-950"
      >
        <FiRefreshCw aria-hidden="true" className="h-4 w-4" />
        Thử tải lại
      </button>
    </div>
  );
}

export function ProductsEmptyNotice() {
  return (
    <div className="flex flex-col gap-1 border-t border-zinc-200 py-10 dark:border-zinc-800">
      <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
        Chưa có sản phẩm phù hợp
      </p>
      <p className="text-xs text-zinc-600 dark:text-zinc-400">
        Hãy thử từ khóa khác hoặc chọn danh mục khác.
      </p>
    </div>
  );
}

// Shown when ?cat= names a category that no longer exists.
export function ProductsUnknownCategory() {
  return (
    <div className="flex flex-col items-start gap-1 border-t border-zinc-200 py-10 dark:border-zinc-800">
      <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
        Danh mục này không còn được áp dụng
      </p>
      <p className="text-xs text-zinc-600 dark:text-zinc-400">
        Cửa hàng vừa thay đổi danh mục. Hãy xem toàn bộ sản phẩm đang có.
      </p>
      <Link href="/products" scroll={false} className={TEXT_LINK}>
        Xem tất cả sản phẩm
        <FiArrowRight aria-hidden="true" className="h-4 w-4" />
      </Link>
    </div>
  );
}
