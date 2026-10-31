import { StaffHeroArt } from "@/components/staff/StaffHeroArt";
import { STAFF_ART } from "@/components/staff/staff-art";
import { BentoCard } from "../../../admin/components/bento/BentoCard";
import { DISPATCH_STATUS_LABELS, formatMonthKey } from "./dispatch-format";
import type { DispatchTab } from "./dispatch-tabs";

type DispatchBoardIntroProps = {
  status: DispatchTab;
  month: string;
};

// Hero card of the dispatch board: the calendar drawing, what the board
// does, and which status and month the queue below is showing.
export function DispatchBoardIntro({ status, month }: DispatchBoardIntroProps) {
  return (
    <BentoCard
      label="Bàn điều phối đơn hàng"
      tour="disp-board-intro"
      className="sm:col-span-2 lg:col-span-2"
    >
      <div className="flex items-center gap-4">
        <StaffHeroArt art={STAFF_ART.calendar} />
        <div className="min-w-0">
          <h2 className="text-base font-bold tracking-tight text-[#1E3A5F] sm:text-lg dark:text-zinc-50">
            Bàn điều phối đơn hàng
          </h2>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            Xem đơn theo trạng thái, xác nhận lịch hẹn, phân công thợ trực tuyến
            và hủy đơn khi khách yêu cầu.
          </p>
        </div>
      </div>
      <p className="mt-3 flex items-center gap-1.5 text-xs font-medium text-zinc-600 dark:text-zinc-300">
        <span
          aria-hidden="true"
          className="h-1.5 w-1.5 rounded-full bg-[#1E3A5F] motion-safe:animate-pulse dark:bg-zinc-100"
        />
        Đang xem: {DISPATCH_STATUS_LABELS[status]} · {formatMonthKey(month)}
      </p>
    </BentoCard>
  );
}
