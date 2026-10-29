import Link from "next/link";
import { FiLifeBuoy } from "react-icons/fi";

const RESCUE_POINTS = [
  "Giá mở cửa rõ ràng",
  "Tính theo km",
  "Phụ phí đêm minh bạch",
];

// Hero 2x2 card on the navy brand surface: giant 24/7 display plus the
// rescue entry. Rescue stays public (no login): guests and customers both
// land on /rescue. Top-left on lg, first in DOM on mobile.
export function RescueHeroCard() {
  return (
    <section
      aria-label="Cứu hộ khẩn cấp"
      data-reveal
      className="flex flex-col justify-between gap-6 rounded-2xl bg-[#1E3A5F] p-5 text-white sm:col-span-2 md:p-7 lg:row-span-2"
    >
      <div>
        <p className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-white">
            <FiLifeBuoy aria-hidden="true" className="h-5 w-5" />
          </span>
          <span className="text-xs font-semibold tracking-wide text-zinc-200 uppercase">
            Cứu hộ khẩn cấp
          </span>
        </p>
        <p className="mt-6 text-6xl font-bold tracking-tight text-white lg:text-7xl">
          24/7
        </p>
        <p className="mt-3 max-w-sm text-base text-zinc-200">
          Hết bình, thủng lốp, chết máy giữa đường? Thợ trực luôn sẵn sàng lên
          đường.
        </p>
      </div>
      <div>
        <ul className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          {RESCUE_POINTS.map((label) => (
            <li
              key={label}
              className="rounded-xl border border-white/15 px-3 py-2.5 text-center text-xs font-medium text-zinc-100"
            >
              {label}
            </li>
          ))}
        </ul>
        <Link
          href="/rescue"
          aria-label="Gửi yêu cầu cứu hộ ngay, không cần đăng nhập"
          className="mt-5 flex min-h-[44px] items-center justify-center rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-[#1E3A5F] transition-colors duration-200 hover:bg-zinc-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#1E3A5F] motion-safe:active:scale-[0.99]"
        >
          Đặt cứu hộ ngay
        </Link>
      </div>
    </section>
  );
}
