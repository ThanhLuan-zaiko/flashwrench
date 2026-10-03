import type { Metadata } from "next";
import { MIX_RANGE_TABS } from "@/components/customer-mix/customer-mix-format";

type RangeParams = { params: Promise<{ range: string }> };

const FALLBACK_TITLE = "Nguồn khách hàng | Điều phối";
const FALLBACK_DESCRIPTION =
  "Tỷ trọng khách thành viên và khách vãng lai theo đơn tạo và lượt đăng nhập.";

export async function generateMetadata({
  params,
}: RangeParams): Promise<Metadata> {
  const { range } = await params;
  const entry = MIX_RANGE_TABS.find((item) => item.id === range);
  if (!entry) {
    return { title: FALLBACK_TITLE, description: FALLBACK_DESCRIPTION };
  }
  return {
    title: `Nguồn khách hàng theo ${entry.label.toLowerCase()} | Điều phối`,
    description: FALLBACK_DESCRIPTION,
  };
}

// Metadata-only: the interactive board lives in the customer-mix layout shell.
export default function DispatchCustomerMixRangePage() {
  return null;
}
