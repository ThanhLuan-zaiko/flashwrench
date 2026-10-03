import type { UserRole } from "@/lib/auth/user.types";

// Client-safe gate for the floating chat surface. The FAB and its panel stay
// visible for every visitor (including guests), while inbox data, realtime
// and thread mutations remain exclusive to customers and mechanics.
// Backend enforcement lives in lib/chat/chat-access.ts; this mirror must
// stay in sync with `isChatRole` there.
export function canUseChat(role: UserRole | null | undefined): boolean {
  return role === "customer" || role === "mechanic";
}

export type ChatEmptyAction = { label: string; href: string };

// First-run shortcuts for an empty inbox: deep links into the booking flow
// so the empty state never dead-ends.
export function getChatEmptyActions(): ChatEmptyAction[] {
  return [
    { label: "Xem dịch vụ", href: "/services" },
    { label: "Đặt lịch ngay", href: "/booking" },
  ];
}
