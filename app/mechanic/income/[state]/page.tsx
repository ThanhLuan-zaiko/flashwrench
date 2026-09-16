import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { IncomeSection } from "../../components/income/IncomeSection";
import { INCOME_TABS, isIncomeTab } from "../../components/income/income-tabs";

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

export default async function MechanicIncomeStatePage({ params }: StateParams) {
  const { state } = await params;
  if (!isIncomeTab(state)) notFound();
  return <IncomeSection key={state} state={state} />;
}
