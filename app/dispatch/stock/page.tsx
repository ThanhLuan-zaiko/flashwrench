import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Tồn kho | FlashWrench",
};

// Metadata-only: the stock console lives in the /dispatch/stock layout
// shell so page switches reuse it without remounting.
export default function DispatchStockPage() {
  return null;
}
