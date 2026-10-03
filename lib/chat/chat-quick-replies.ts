// Canned one-tap replies for the support chat. Client-safe and role
// aware: customers get status questions, mechanics get on-the-road
// updates. Guests and staff get nothing, the panel stays locked for them.
import type { UserRole } from "@/lib/auth/user.types";

const CUSTOMER_REPLIES = [
  "Thợ đang ở đâu rồi ạ?",
  "Cho tôi xin báo giá trước nhé",
  "Tôi gửi thêm ảnh xe nhé",
  "Tôi đang đứng cạnh xe rồi",
  "Cảm ơn thợ nhiều nhé",
] as const;

const MECHANIC_REPLIES = [
  "Tôi đang trên đường tới",
  "Cho tôi xin vị trí xe nhé",
  "Vui lòng gửi ảnh hư hỏng",
  "Tôi tới trong 15 phút nữa",
  "Xe đã sửa xong rồi nhé",
] as const;

export function getChatQuickReplies(
  role: UserRole | null | undefined,
): string[] {
  if (role === "customer") return [...CUSTOMER_REPLIES];
  if (role === "mechanic") return [...MECHANIC_REPLIES];
  return [];
}
