import { BOOKING_TRACK_STAGES } from "@/lib/track/booking-track-view";

type TrackProgressCardProps = {
  stage: number;
  // One short detail line per stage, same order as BOOKING_TRACK_STAGES.
  details: readonly (string | null)[];
};

// Four-stage progress card: done stages filled navy, the current one
// ringed and bold, upcoming ones muted.
export function TrackProgressCard({ stage, details }: TrackProgressCardProps) {
  return (
    <section
      aria-label="Tiến độ"
      className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950"
    >
      <div className="flex items-baseline justify-between">
        <p className="text-[11px] font-semibold tracking-[0.14em] text-[#1E3A5F] uppercase dark:text-zinc-400">
          Tiến độ
        </p>
        <p className="text-xs font-bold text-zinc-900 dark:text-zinc-50">
          {stage + 1}/{BOOKING_TRACK_STAGES.length} bước
        </p>
      </div>
      <ol className="mt-3 flex flex-col gap-3">
        {BOOKING_TRACK_STAGES.map((label, index) => {
          const done = index < stage;
          const active = index === stage;
          return (
            <li
              key={label}
              aria-current={active ? "step" : undefined}
              className="flex gap-2.5"
            >
              <span
                aria-hidden="true"
                className={`mt-1 flex h-3 w-3 shrink-0 items-center justify-center rounded-full border-2 ${
                  done
                    ? "border-[#1E3A5F] bg-[#1E3A5F] dark:border-zinc-100 dark:bg-zinc-100"
                    : active
                      ? "border-[#1E3A5F] bg-white dark:border-zinc-100 dark:bg-zinc-950"
                      : "border-zinc-300 bg-white dark:border-zinc-700 dark:bg-zinc-950"
                }`}
              />
              <span className="flex min-w-0 flex-col">
                <span
                  className={`text-[13px] ${
                    active
                      ? "font-bold text-[#1E3A5F] dark:text-zinc-50"
                      : done
                        ? "font-semibold text-zinc-900 dark:text-zinc-100"
                        : "font-semibold text-zinc-400 dark:text-zinc-600"
                  }`}
                >
                  {label}
                </span>
                {details[index] && (
                  <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
                    {details[index]}
                  </span>
                )}
              </span>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
