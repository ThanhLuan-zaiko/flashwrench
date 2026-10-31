import type { IconType } from "react-icons";
import {
  FiCalendar,
  FiDollarSign,
  FiMap,
  FiTool,
  FiTrendingUp,
} from "react-icons/fi";
import type { StaffNavGroup } from "@/components/staff/staff-shell.types";

export type MechanicSectionId = "schedule" | "map" | "income" | "stats";

export type MechanicSection = {
  id: MechanicSectionId;
  label: string;
  description: string;
  group: string;
  href: string;
  icon: IconType;
};

export const MECHANIC_SECTIONS: MechanicSection[] = [
  {
    id: "schedule",
    group: "work",
    label: "Quản lý lịch làm việc",
    description: "Nhận và xử lý yêu cầu từ khách hàng",
    href: "/mechanic/schedule/all",
    icon: FiCalendar,
  },
  {
    id: "map",
    group: "work",
    label: "Điều hướng",
    description: "Bản đồ và chỉ đường đến điểm sửa xe",
    href: "/mechanic/map",
    icon: FiMap,
  },
  {
    id: "income",
    group: "earnings",
    label: "Quản lý thu nhập",
    description: "Theo dõi doanh thu và lịch sử giao dịch",
    href: "/mechanic/income/all",
    icon: FiDollarSign,
  },
  {
    id: "stats",
    group: "earnings",
    label: "Thống kê hiệu suất",
    description: "Số đơn hoàn thành và đánh giá trung bình",
    href: "/mechanic/stats",
    icon: FiTrendingUp,
  },
];

export function getMechanicSection(id: MechanicSectionId): MechanicSection {
  return MECHANIC_SECTIONS.find((s) => s.id === id) ?? MECHANIC_SECTIONS[0];
}

export const MECHANIC_NAV_GROUPS: StaffNavGroup[] = [
  { id: "work", label: "Công việc", shortLabel: "Việc", icon: FiTool },
  {
    id: "earnings",
    label: "Thu nhập",
    shortLabel: "Thu nhập",
    icon: FiDollarSign,
  },
];
