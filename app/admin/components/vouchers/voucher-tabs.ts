import type { IconType } from "react-icons";
import { FiGift, FiTrash2 } from "react-icons/fi";

export type VoucherTab = "campaigns" | "trash";

export type VoucherTabDef = {
  id: VoucherTab;
  label: string;
  href: string;
  icon: IconType;
  title: string;
  description: string;
};

function tabHref(id: VoucherTab): string {
  return `/admin/vouchers/${id}`;
}

export const VOUCHER_TABS: VoucherTabDef[] = [
  {
    id: "campaigns",
    label: "Chiến dịch",
    href: tabHref("campaigns"),
    icon: FiGift,
    title: "Chiến dịch | Ưu đãi voucher",
    description: "Quản lý chiến dịch ví voucher gắn tài khoản.",
  },
  {
    id: "trash",
    label: "Thùng rác",
    href: tabHref("trash"),
    icon: FiTrash2,
    title: "Thùng rác | Ưu đãi voucher",
    description: "Khôi phục hoặc xóa vĩnh viễn chiến dịch voucher.",
  },
];

export function isVoucherTab(value: unknown): value is VoucherTab {
  return value === "campaigns" || value === "trash";
}
