import type { PublicUser } from "@/lib/auth/user.types";

// The header cart shortcut hides only for authenticated staff roles:
// guests still reach /cart (which shows a sign-in prompt) and customers
// always see it, so the icon never pops in and out on session changes
// or while the session query is still resolving.
export function canSeeCartLink(user: PublicUser | null | undefined): boolean {
  if (!user) return true;
  return user.role === "customer";
}
