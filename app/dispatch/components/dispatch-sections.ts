import type { IconType } from "react-icons";
import {
  FiArchive,
  FiBarChart2,
  FiCompass,
  FiGift,
  FiLifeBuoy,
  FiPackage,
  FiPieChart,
} from "react-icons/fi";

export type DispatchSectionId =
  | "board"
  | "rescue"
  | "orders"
  | "vouchers"
  | "stock"
  | "revenue"
  | "customer-mix";

export type DispatchSection = {
  id: DispatchSectionId;
  label: string;
  description: string;
  href: string;
  icon: IconType;
};

export const DISPATCH_SECTIONS: DispatchSection[] = [
  {
    id: "board",
    label: "Bàn điều phối",
    description: "Xác nhận, phân công thợ và theo dõi đơn",
    href: "/dispatch/bookings/pending",
    icon: FiCompass,
  },
  {
    id: "rescue",
    label: "Cứu hộ khẩn cấp",
    description: "Theo dõi yêu cầu hệ thống tự giao thợ",
    href: "/dispatch/rescue/open",
    icon: FiLifeBuoy,
  },
  {
    id: "orders",
    label: "Đơn linh kiện",
    description: "Xác nhận, đóng gói và giao đơn mua linh kiện",
    href: "/dispatch/orders/pending",
    icon: FiPackage,
  },
  {
    id: "vouchers",
    label: "Phát voucher",
    description: "Phát voucher gắn tài khoản trong hạn mức",
    href: "/dispatch/vouchers",
    icon: FiGift,
  },
  {
    id: "stock",
    label: "Tồn kho",
    description: "Kiểm kê và điều chỉnh số lượng linh kiện",
    href: "/dispatch/stock",
    icon: FiArchive,
  },
  {
    id: "revenue",
    label: "Doanh thu",
    description: "Báo cáo theo ngày, tuần, tháng, năm và xuất CSV",
    href: "/dispatch/revenue/day",
    icon: FiBarChart2,
  },
  {
    id: "customer-mix",
    label: "Nguồn khách hàng",
    description: "Tỷ trọng khách thành viên và vãng lai theo đơn và đăng nhập",
    href: "/dispatch/customer-mix/day",
    icon: FiPieChart,
  },
];

export function getDispatchSection(id: DispatchSectionId): DispatchSection {
  return DISPATCH_SECTIONS.find((s) => s.id === id) ?? DISPATCH_SECTIONS[0];
}
