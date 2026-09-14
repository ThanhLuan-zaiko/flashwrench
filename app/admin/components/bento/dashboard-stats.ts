import { FiCalendar, FiLifeBuoy, FiTool, FiTrendingUp } from "react-icons/fi";
import type { DashboardStat } from "./DashboardStatCard";

export const DASHBOARD_STATS: DashboardStat[] = [
  {
    id: "bookings-today",
    label: "Lịch đặt hôm nay",
    hint: "Bao gồm mọi trạng thái",
    icon: FiCalendar,
  },
  {
    id: "rescue-open",
    label: "Cứu hộ đang mở",
    hint: "Chờ điều phối và đang xử lý",
    icon: FiLifeBuoy,
  },
  {
    id: "mechanics-online",
    label: "Thợ đang trực tuyến",
    hint: "Sẵn sàng nhận việc",
    icon: FiTool,
  },
  {
    id: "revenue-month",
    label: "Doanh thu tháng này",
    hint: "Tổng đơn đã thanh toán (VND)",
    icon: FiTrendingUp,
  },
];
