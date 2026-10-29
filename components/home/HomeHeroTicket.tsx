import Image from "next/image";
import { FiCheck, FiTool, FiTruck } from "react-icons/fi";
import logoImage from "@/asset/flashwrench.png";

type TicketStep = {
  label: string;
  state: "done" | "current" | "upcoming";
};

// Illustrative tracking preview: shows the three stages a booking moves
// through. It is a static example, not a live record, so it is labelled.
const TICKET_STEPS: TicketStep[] = [
  { label: "Đã nhận yêu cầu", state: "done" },
  { label: "Thợ đang đến", state: "current" },
  { label: "Sửa xong, nghiệm thu", state: "upcoming" },
];

const STEP_ICON = {
  done: FiCheck,
  current: FiTruck,
  upcoming: FiTool,
} as const;

// Right-hand hero card. Monochrome white card on the navy panel so the
// eye lands on the copy and the orange booking button first.
export function HomeHeroTicket() {
  return (
    <section
      data-reveal
      aria-label="Ví dụ theo dõi tiến độ"
      className="rounded-2xl bg-white p-5 text-zinc-900 sm:p-6"
    >
      <div className="flex items-center justify-between gap-3 border-b border-zinc-200 pb-4">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold tracking-wide text-zinc-500 uppercase">
            Ví dụ theo dõi
          </p>
          <p className="mt-1 text-base font-bold text-zinc-900">
            Thay lốp tại nhà
          </p>
        </div>
        <Image src={logoImage} alt="" className="h-12 w-auto shrink-0" />
      </div>

      <ol className="mt-5 flex flex-col gap-4">
        {TICKET_STEPS.map((step) => {
          const Icon = STEP_ICON[step.state];
          const isDone = step.state === "done";
          const isCurrent = step.state === "current";
          return (
            <li key={step.label} className="flex items-center gap-3">
              <span
                aria-hidden="true"
                className={
                  isDone
                    ? "flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#1E3A5F] text-white"
                    : isCurrent
                      ? "flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 border-[#1E3A5F] text-[#1E3A5F]"
                      : "flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-zinc-200 text-zinc-400"
                }
              >
                <Icon className="h-4 w-4" />
              </span>
              <div className="min-w-0">
                <p
                  className={
                    step.state === "upcoming"
                      ? "text-sm font-medium text-zinc-500"
                      : "text-sm font-semibold text-zinc-900"
                  }
                >
                  {step.label}
                </p>
                {isCurrent ? (
                  <p className="text-xs text-zinc-500">
                    Thợ đang trên đường tới
                  </p>
                ) : null}
              </div>
            </li>
          );
        })}
      </ol>

      <div className="mt-6 flex items-center justify-between gap-3 rounded-xl bg-zinc-100 px-4 py-3">
        <p className="text-xs text-zinc-600">
          Giá chốt trước khi thợ xuất phát
        </p>
        <p className="shrink-0 text-xs font-semibold text-zinc-900">
          Không phí ẩn
        </p>
      </div>
    </section>
  );
}
