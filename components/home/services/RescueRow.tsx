import Image from "next/image";
import Link from "next/link";
import { FiArrowRight } from "react-icons/fi";

// Opening row of the services list: the 24/7 rescue entry as plain type on
// the page surface. Rescue stays public (no login required).
export function RescueRow() {
  return (
    <li>
      <span
        data-rule
        aria-hidden="true"
        className="block h-px origin-left bg-zinc-200 dark:bg-zinc-800"
      />
      <div
        data-chapter-row
        className="grid grid-cols-1 items-center gap-4 py-6 md:grid-cols-[auto_minmax(0,1fr)_auto] md:gap-x-10 md:py-8"
      >
        <p className="text-6xl leading-none font-bold tracking-tight text-[#1E3A5F] md:text-8xl dark:text-zinc-50">
          24/7
        </p>
        <div className="min-w-0">
          <p className="text-xs font-semibold tracking-wide text-zinc-500 uppercase dark:text-zinc-400">
            Cứu hộ khẩn cấp
          </p>
          <p className="mt-2 max-w-md text-base text-zinc-700 dark:text-zinc-300">
            Hết bình, thủng lốp, chết máy giữa đường? Thợ trực nhận yêu cầu cả
            ngày lẫn đêm. Giá mở cửa, phí theo km và phụ phí ban đêm hiển thị
            trước khi bạn xác nhận.
          </p>
          <Link
            href="/rescue"
            aria-label="Gửi yêu cầu cứu hộ ngay, không cần đăng nhập"
            className="mt-3 inline-flex min-h-11 items-center gap-1.5 text-sm font-bold text-[#1E3A5F] underline-offset-4 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1E3A5F] dark:text-zinc-100 dark:focus-visible:ring-zinc-100"
          >
            Đặt cứu hộ ngay
            <FiArrowRight aria-hidden="true" className="h-4 w-4" />
          </Link>
        </div>
        <Image
          src="/images/isometric/tow-truck.svg"
          alt=""
          width={271}
          height={210}
          className="hidden h-auto w-40 md:block lg:w-48"
        />
      </div>
    </li>
  );
}
