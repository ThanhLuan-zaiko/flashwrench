import { StaffHeroArt } from "@/components/staff/StaffHeroArt";
import { STAFF_ART } from "@/components/staff/staff-art";
import { formatClock } from "./pulse-format";

type PulseHeaderProps = {
  updatedAt: number;
  isFetching: boolean;
};

// Section title plus the live badge: the dot swells while a realtime
// refetch is in flight, and the stamp shows when the numbers last landed.
export function PulseHeader({ updatedAt, isFetching }: PulseHeaderProps) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div className="flex items-center gap-4">
        <StaffHeroArt art={STAFF_ART.van} />
        <div>
          <p className="text-xs font-bold tracking-[0.14em] text-zinc-600 uppercase dark:text-zinc-400">
            Điều phối · Hôm nay
          </p>
          <h2 className="mt-1 text-2xl font-extrabold tracking-tight text-[#1E3A5F] sm:text-[28px] dark:text-zinc-50">
            Nhịp vận hành
          </h2>
        </div>
      </div>
      <div className="flex items-center gap-2.5">
        {updatedAt > 0 && (
          <span className="text-xs text-zinc-600 tabular-nums dark:text-zinc-400">
            Cập nhật {formatClock(updatedAt)}
          </span>
        )}
        <span
          role="status"
          className="flex h-9 items-center gap-2 rounded-full border border-zinc-200 px-3.5 text-[13px] font-bold text-[#1E3A5F] dark:border-zinc-800 dark:text-zinc-100"
        >
          <span
            aria-hidden="true"
            className={`h-2.5 w-2.5 rounded-full bg-[#1E3A5F] motion-safe:transition-transform motion-safe:duration-300 dark:bg-zinc-100 ${
              isFetching ? "scale-150 opacity-60" : ""
            }`}
          />
          Trực tiếp
        </span>
      </div>
    </div>
  );
}
