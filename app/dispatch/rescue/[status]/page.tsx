import type { Metadata } from "next";
import { RESCUE_BOARD_TABS } from "../../components/rescue/rescue-tabs";

type StatusParams = { params: Promise<{ status: string }> };

export async function generateMetadata({
  params,
}: StatusParams): Promise<Metadata> {
  const { status } = await params;
  const tab = RESCUE_BOARD_TABS.find((item) => item.id === status);
  return {
    title: tab
      ? `${tab.label} | Cứu hộ FlashWrench`
      : "Cứu hộ | Điều phối FlashWrench",
    description: "Theo dõi yêu cầu cứu hộ do hệ thống tự giao thợ.",
  };
}

export default function DispatchRescueStatusPage() {
  return null;
}
