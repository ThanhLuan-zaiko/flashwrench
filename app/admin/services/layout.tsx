import type { ReactNode } from "react";
import { CatalogRouteShell } from "../components/services/CatalogRouteShell";

// Shared shell for /admin/services/[tab]. Next.js keeps the layout mounted
// while only the tab segment changes, so switching tabs reuses the screen
// state (filters, dialogs) and renders instantly without replaying the GSAP
// enter animation. Pages stay metadata-only.
export default function AdminServicesLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <>
      <CatalogRouteShell />
      {children}
    </>
  );
}
