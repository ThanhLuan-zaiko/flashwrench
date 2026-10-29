type TicketStep = {
  label: string;
  detail: string;
  state: "done" | "current" | "upcoming";
};

// Illustrative tracking preview: the three stages a booking moves through.
// It is a static example, not a live record, and the copy says so through
// the aria-label and the surrounding page.
const TICKET_STEPS: TicketStep[] = [
  { label: "Đã nhận yêu cầu", detail: "09:12 · Quận 7", state: "done" },
  {
    label: "Thợ đang đến",
    detail: "Anh Minh · còn khoảng 12 phút",
    state: "current",
  },
  {
    label: "Sửa chữa và thanh toán",
    detail: "Giá cố định 380.000đ",
    state: "upcoming",
  },
];

const DOT_CLASS = {
  done: "bg-[#1E3A5F]",
  current: "border-2 border-[#1E3A5F] bg-white",
  upcoming: "border-2 border-zinc-400 bg-white",
} as const;

// Right-hand hero card styled as a repair ticket: header row, a dot timeline
// and a route bar from the mechanic to the customer. Borders and type carry
// the hierarchy, no shadow.
export function HomeHeroTicket() {
  return (
    <section
      data-reveal
      aria-label="Ví dụ theo dõi tiến độ"
      className="rounded-3xl border border-zinc-200 bg-zinc-50 p-6 text-zinc-900 sm:p-7 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50"
    >
      <div className="flex items-center justify-between gap-3 border-b border-dashed border-zinc-400 pb-4">
        <p className="text-[11px] font-semibold tracking-[0.12em] text-zinc-600 uppercase">
          Phiếu sửa #FW-2841
        </p>
        <p className="text-sm font-semibold text-[#1E3A5F]">Đang đến</p>
      </div>

      <ol className="mt-5">
        {TICKET_STEPS.map((step, index) => {
          const isLast = index === TICKET_STEPS.length - 1;
          return (
            <li key={step.label} className="relative pb-6 pl-7 last:pb-0">
              <span
                aria-hidden="true"
                className={`absolute top-1 left-0 h-3.5 w-3.5 rounded-full ${DOT_CLASS[step.state]}`}
              />
              {!isLast && (
                <span
                  aria-hidden="true"
                  className={`absolute top-5 bottom-0 left-[6px] w-0.5 ${
                    step.state === "done"
                      ? "bg-[#1E3A5F]"
                      : "bg-[repeating-linear-gradient(180deg,#a1a1aa_0_4px,transparent_4px_8px)]"
                  }`}
                />
              )}
              <p
                className={
                  step.state === "upcoming"
                    ? "text-sm font-semibold text-zinc-500"
                    : "text-sm font-bold text-zinc-900"
                }
              >
                {step.label}
              </p>
              <p className="mt-0.5 text-xs text-zinc-600">{step.detail}</p>
            </li>
          );
        })}
      </ol>

      <div
        aria-hidden="true"
        className="relative mt-5 h-28 overflow-hidden rounded-2xl border border-zinc-200 bg-white"
      >
        <span className="absolute top-1/2 right-[12%] left-[12%] h-px bg-[repeating-linear-gradient(90deg,#a1a1aa_0_10px,transparent_10px_18px)]" />
        <span className="absolute top-[42%] left-[22%] h-3 w-3 rounded-full bg-[#1E3A5F]" />
        <span className="absolute top-[42%] right-[18%] h-3 w-3 rounded-sm bg-zinc-900" />
        <span className="absolute bottom-2.5 left-3 text-[11px] text-zinc-600">
          Thợ → Bạn
        </span>
      </div>
    </section>
  );
}
