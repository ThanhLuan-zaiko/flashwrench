"use client";

import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { FiCheck } from "react-icons/fi";

const COPY = {
  booking: {
    title: "Đặt lịch thành công!",
    body: "Thợ sẽ xác nhận qua thông tin liên hệ của bạn trong vài phút. Hãy lưu lại đường dẫn này để theo dõi lịch hẹn.",
    illustration: "/images/isometric/clipboard.svg",
    width: 35,
    height: 53,
  },
  order: {
    title: "Đặt hàng thành công!",
    body: "Cửa hàng sẽ xác nhận đơn trong ít phút. Hãy lưu lại đường dẫn này để theo dõi giao hàng.",
    illustration: "/images/isometric/package.svg",
    width: 60,
    height: 53,
  },
} as const;

type TrackPlacedBannerProps = {
  kind: keyof typeof COPY;
};

// Confirmation shown once right after a guest submits: checkout and the
// booking form redirect here with `?placed=1`, so the tracker doubles as
// the success screen. Without the flag nothing renders.
export function TrackPlacedBanner({ kind }: TrackPlacedBannerProps) {
  const placed = useSearchParams().get("placed") === "1";
  if (!placed) return null;
  const copy = COPY[kind];
  return (
    <section
      aria-label={copy.title}
      className="flex items-center justify-between gap-4 rounded-2xl border border-zinc-200 bg-white p-4 sm:p-5 dark:border-zinc-800 dark:bg-zinc-950"
    >
      <div className="flex min-w-0 flex-col gap-1.5">
        <p className="flex items-center gap-2 text-lg font-extrabold tracking-tight text-[#1E3A5F] dark:text-zinc-50">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#1E3A5F] text-white dark:bg-zinc-100 dark:text-zinc-900">
            <FiCheck aria-hidden="true" className="h-4 w-4" />
          </span>
          {copy.title}
        </p>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">{copy.body}</p>
      </div>
      <Image
        src={copy.illustration}
        alt=""
        width={copy.width}
        height={copy.height}
        className="hidden h-24 w-auto shrink-0 sm:block"
      />
    </section>
  );
}
