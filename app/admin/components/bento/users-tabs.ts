import type { IconType } from "react-icons";
import { FiInbox, FiUserCheck, FiUserX } from "react-icons/fi";

export type UserTabId = "approve" | "lock" | "complaints";

export type UserTab = {
  id: UserTabId;
  label: string;
  hint: string;
  icon: IconType;
};

export const USER_TABS: UserTab[] = [
  {
    id: "approve",
    label: "Duyệt thợ",
    hint: "Hồ sơ đăng ký làm thợ mới",
    icon: FiUserCheck,
  },
  {
    id: "lock",
    label: "Khóa tài khoản",
    hint: "Tìm và xử lý tài khoản vi phạm",
    icon: FiUserX,
  },
  {
    id: "complaints",
    label: "Khiếu nại",
    hint: "Phản ánh từ khách hàng",
    icon: FiInbox,
  },
];
