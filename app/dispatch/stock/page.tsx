import type { Metadata } from "next";
import { StockBoard } from "../components/stock/StockBoard";

export const metadata: Metadata = {
  title: "Tồn kho | FlashWrench",
};

// Standalone stock page: the dispatch layout already gates the role and
// renders the shell, so this page only mounts the board.
export default function DispatchStockPage() {
  return <StockBoard />;
}
