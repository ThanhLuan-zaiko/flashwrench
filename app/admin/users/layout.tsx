import type { ReactNode } from "react";
import { UsersRouteShell } from "../components/users/UsersRouteShell";

// Shared shell for /admin/users/[tab]. Next.js keeps the layout mounted
// while only the tab segment changes, so switching tabs reuses the screen
// state (filters, dialogs) and renders instantly without replaying the GSAP
// enter animation. Pages stay metadata-only.
export default function AdminUsersLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <>
      <UsersRouteShell />
      {children}
    </>
  );
}
