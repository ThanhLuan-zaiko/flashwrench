import type { Metadata } from "next";
import { ScheduleSection } from "../components/schedule/ScheduleSection";

export const metadata: Metadata = {
  title: "Lịch làm việc | Thợ xe FlashWrench",
  description: "Nhận đơn, di chuyển tới điểm sửa và chốt đơn sửa xe.",
};

export default function MechanicSchedulePage() {
  return <ScheduleSection />;
}
