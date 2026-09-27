import type { IconType } from "react-icons";
import { FiArchive, FiCompass, FiPackage } from "react-icons/fi";

export type DispatchSectionId = "board" | "orders" | "stock";

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
    id: "orders",
    label: "Đơn linh kiện",
    description: "Xác nhận, đóng gói và giao đơn mua linh kiện",
    href: "/dispatch/orders/pending",
    icon: FiPackage,
  },
  {
    id: "stock",
    label: "Tồn kho",
    description: "Kiểm kê và điều chỉnh số lượng linh kiện",
    href: "/dispatch/stock",
    icon: FiArchive,
  },
];

export function getDispatchSection(id: DispatchSectionId): DispatchSection {
  return DISPATCH_SECTIONS.find((s) => s.id === id) ?? DISPATCH_SECTIONS[0];
}
