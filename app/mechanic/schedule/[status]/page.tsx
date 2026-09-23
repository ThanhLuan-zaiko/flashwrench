import type { Metadata } from "next";
import { SCHEDULE_TABS } from "../../components/schedule/schedule-tabs";

type StatusParams = { params: Promise<{ status: string }> };

export async function generateMetadata({
  params,
}: StatusParams): Promise<Metadata> {
  const { status } = await params;
  const tab = SCHEDULE_TABS.find((item) => item.id === status);
  return {
    title: tab
      ? `${tab.label} | Lịch làm việc thợ xe`
      : "Lịch làm việc | Thợ xe FlashWrench",
    description: "Nhận đơn, di chuyển tới điểm sửa và chốt đơn sửa xe.",
  };
}

export default function MechanicScheduleStatusPage() {
  return null;
}
