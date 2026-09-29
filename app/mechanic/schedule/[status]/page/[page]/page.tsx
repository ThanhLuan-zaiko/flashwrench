import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { parsePageParam } from "@/lib/pagination/page-param";
import { SCHEDULE_TABS } from "../../../../components/schedule/schedule-tabs";

type PageParams = { params: Promise<{ status: string; page: string }> };

export async function generateMetadata({
  params,
}: PageParams): Promise<Metadata> {
  const { status, page } = await params;
  const tab = SCHEDULE_TABS.find((item) => item.id === status);
  return {
    title: tab
      ? `${tab.label} — Trang ${page} | Lịch làm việc thợ xe`
      : "Lịch làm việc | Thợ xe FlashWrench",
    description: "Nhận đơn, di chuyển tới điểm sửa và chốt đơn sửa xe.",
  };
}

// Metadata-only leaf: the /mechanic/schedule layout shell renders the
// section and reads the page segment itself. Page 1 canonicalizes to the
// tab root.
export default async function MechanicScheduleStatusPagedPage({
  params,
}: PageParams) {
  const { status, page } = await params;
  const n = parsePageParam(page);
  if (n === null || n === 1) {
    redirect(`/mechanic/schedule/${encodeURIComponent(status)}`);
  }
  return null;
}
