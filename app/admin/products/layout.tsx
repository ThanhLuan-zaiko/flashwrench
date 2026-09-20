import type { ReactNode } from "react";
import { ProductsRouteShell } from "../components/products/ProductsRouteShell";

// Shared shell for /admin/products/[tab]. Next.js keeps the layout mounted
// while only the tab segment changes, so switching tabs reuses the screen
// state (filters, dialogs) and renders instantly without replaying the
// GSAP enter animation. Pages stay metadata-only.
export default function AdminProductsLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <>
      <ProductsRouteShell />
      {children}
    </>
  );
}
