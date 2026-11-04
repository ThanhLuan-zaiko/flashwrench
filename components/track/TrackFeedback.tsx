"use client";

import Image from "next/image";
import Link from "next/link";
import { FiLoader, FiXCircle } from "react-icons/fi";

// Small shared states for the public tracking screens.
export function TrackLoading() {
  return (
    <p className="flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-400">
      <FiLoader
        aria-hidden="true"
        className="h-4 w-4 motion-safe:animate-spin"
      />
      Đang tải tiến trình…
    </p>
  );
}

export function TrackError() {
  return (
    <p className="text-xs text-zinc-600 dark:text-zinc-400">
      Không tải được tiến trình. Trang sẽ tự thử lại — hoặc gọi hotline để được
      hỗ trợ.
    </p>
  );
}

type TrackAbortedProps = {
  title: string;
  body?: string;
  // Optional isometric drawing and the one follow-up action on the card.
  illustration?: { src: string; width: number; height: number };
  action?: { href: string; label: string };
};

export function TrackAborted({
  title,
  body,
  illustration,
  action,
}: TrackAbortedProps) {
  return (
    <div className="flex flex-col items-center gap-3 py-8 text-center">
      {illustration && (
        <Image
          src={illustration.src}
          alt=""
          width={illustration.width}
          height={illustration.height}
          className="mb-1 h-24 w-auto sm:h-28"
        />
      )}
      <p className="flex items-center gap-2 text-base font-extrabold tracking-tight text-[#111111] dark:text-zinc-50">
        <FiXCircle aria-hidden="true" className="h-5 w-5 shrink-0" />
        {title}
      </p>
      {body ? (
        <p className="max-w-sm text-sm text-zinc-800 dark:text-zinc-400">
          {body}
        </p>
      ) : null}
      {action && (
        <Link
          href={action.href}
          className="mt-2 flex min-h-[44px] items-center justify-center rounded-xl px-5 py-2.5 text-sm font-bold transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#111111] focus-visible:ring-offset-2 dark:focus-visible:ring-offset-zinc-950 bg-[#1D4ED8] text-white hover:bg-[#1E40AF] dark:bg-[#60A5FA] dark:text-[#111111] dark:hover:bg-[#93C5FD]"
        >
          {action.label}
        </Link>
      )}
    </div>
  );
}
