import type { Metadata } from "next";
import { IncomeSection } from "../components/income/IncomeSection";

export const metadata: Metadata = {
  title: "Thu nhập | Thợ xe FlashWrench",
  description: "Doanh thu và lịch sử giao dịch của thợ sửa xe.",
};

export default function MechanicIncomePage() {
  return <IncomeSection />;
}
