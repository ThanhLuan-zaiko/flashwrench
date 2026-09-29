import type { ReactNode } from "react";
import { StockBoard } from "../components/stock/StockBoard";

// Shared shell for /dispatch/stock and /dispatch/stock/page/N. Next.js
// keeps the layout mounted while only the page segment changes, so the
// stock filter survives page switches. Pages stay metadata-only.
export default function DispatchStockLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <>
      <StockBoard />
      {children}
    </>
  );
}
