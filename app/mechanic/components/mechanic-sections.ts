import type { IconType } from "react-icons";
import { FiCalendar, FiDollarSign, FiMap, FiTrendingUp } from "react-icons/fi";

export type MechanicSectionId = "schedule" | "map" | "income" | "stats";

export type MechanicSection = {
  id: MechanicSectionId;
  label: string;
  description: string;
  href: string;
  icon: IconType;
};

export const MECHANIC_SECTIONS: MechanicSection[] = [
  {
    id: "schedule",
    label: "Quản lý lịch làm việc",
    description: "Nhận và xử lý yêu cầu từ khách hàng",
    href: "/mechanic/schedule",
    icon: FiCalendar,
  },
  {
    id: "map",
    label: "Điều hướng thông minh",
    description: "Tích hợp bản đồ để di chuyển đến điểm sửa xe",
    href: "/mechanic/map",
    icon: FiMap,
  },
  {
    id: "income",
    label: "Quản lý thu nhập",
    description: "Theo dõi doanh thu và lịch sử giao dịch",
    href: "/mechanic/income",
    icon: FiDollarSign,
  },
  {
    id: "stats",
    label: "Thống kê hiệu suất",
    description: "Báo cáo số đơn hoàn thành, rating trung bình",
    href: "/mechanic/stats",
    icon: FiTrendingUp,
  },
];

export function getMechanicSection(id: MechanicSectionId): MechanicSection {
  return MECHANIC_SECTIONS.find((s) => s.id === id) ?? MECHANIC_SECTIONS[0];
}
