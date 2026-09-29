import type { Metadata } from "next";
import { INCOME_TABS } from "../../components/income/income-tabs";

type StateParams = { params: Promise<{ state: string }> };

export async function generateMetadata({
  params,
}: StateParams): Promise<Metadata> {
  const { state } = await params;
  const tab = INCOME_TABS.find((item) => item.id === state);
  return {
    title: tab
      ? `${tab.label} | Thu nhập thợ xe`
      : "Thu nhập | Thợ xe FlashWrench",
    description: "Doanh thu và lịch sử giao dịch của thợ sửa xe.",
  };
}

// Metadata-only leaf: the /mechanic/income layout shell renders the
// section and reads the [state] segment itself.
export default function MechanicIncomeStatePage() {
  return null;
}
