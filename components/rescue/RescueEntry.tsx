"use client";

import { FiClock, FiPhone, FiShield } from "react-icons/fi";
import { BigTypeHeader } from "@/components/bento/BigTypeHeader";
import { useBentoReveal } from "@/hooks/useBentoReveal";
import { RescueForm } from "./RescueForm";
import { RescueSuccess } from "./RescueSuccess";
import { RESCUE_HOTLINE, RESCUE_STEPS } from "./rescue-constants";
import { useRescueForm } from "./useRescueForm";

const SAFETY_NOTES = [
  {
    icon: FiShield,
    title: "Giữ an toàn trước",
    body: "Bật đèn cảnh báo, đặt xe sát lề và đứng nơi an toàn.",
  },
  {
    icon: FiClock,
    title: "Trực 24/7",
    body: "Kể cả ban đêm và ngày lễ, luôn có thợ trực nhận yêu cầu.",
  },
  {
    icon: FiPhone,
    title: "Gọi khi nguy hiểm",
    body: `Va chạm nghiêm trọng hoặc kẹt trên cao tốc: gọi ngay ${RESCUE_HOTLINE}.`,
  },
] as const;

// Public rescue entry: guests file without an account. The header
// states no login is needed; the form collects contact + breakdown +
// location, and success swaps in place without leaving the page.
export function RescueEntry() {
  const rootRef = useBentoReveal<HTMLDivElement>();
  const form = useRescueForm();

  return (
    <div ref={rootRef} className="flex flex-col gap-6 md:gap-8">
      <BigTypeHeader
        level={1}
        eyebrow="Cứu hộ khẩn cấp"
        title="Xe dừng giữa đường? Thợ tới ngay."
        subtitle="Không cần đăng nhập. Điền tên, số điện thoại, vị trí xe và sự cố — thợ trực gọi lại trong vài phút."
      />

      {form.created ? (
        <RescueSuccess
          created={form.created}
          onNewRequest={form.resetCreated}
        />
      ) : (
        <RescueForm form={form} />
      )}

      <section
        aria-label="Cách cứu hộ hoạt động"
        data-reveal
        className="grid grid-cols-1 gap-3 sm:grid-cols-3 md:gap-4"
      >
        {RESCUE_STEPS.map((step, index) => (
          <article
            key={step.title}
            className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950"
          >
            <p className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-100 text-sm font-bold text-zinc-700 dark:bg-zinc-900 dark:text-zinc-200">
              {index + 1}
            </p>
            <h2 className="mt-3 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
              {step.title}
            </h2>
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              {step.body}
            </p>
          </article>
        ))}
      </section>

      <section
        aria-label="Lưu ý an toàn"
        data-reveal
        className="grid grid-cols-1 gap-3 sm:grid-cols-3 md:gap-4"
      >
        {SAFETY_NOTES.map((note) => {
          const Icon = note.icon;
          return (
            <article
              key={note.title}
              className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950"
            >
              <p className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-100 text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">
                <Icon aria-hidden="true" className="h-5 w-5" />
              </p>
              <h2 className="mt-3 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                {note.title}
              </h2>
              <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                {note.body}
              </p>
            </article>
          );
        })}
      </section>
    </div>
  );
}
