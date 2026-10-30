"use client";

import { campaignUsage } from "@/lib/staff-charts/page-series";
import type { VoucherCampaign } from "@/lib/vouchers/voucher.types";
import { LabeledBarRows } from "./LabeledBarRows";
import { ChartHeadline, StaffChartCard } from "./StaffChartCard";

type CampaignUsageChartProps = {
  campaigns: VoucherCampaign[] | undefined;
  isPending: boolean;
  isError: boolean;
  /** Dispatch only sees the campaigns it may grant from. */
  dispatcherOnly?: boolean;
};

// Vouchers granted per live campaign against its total limit, shared by
// the dispatch and admin voucher boards (both refresh on voucher events).
export function CampaignUsageChart({
  campaigns,
  isPending,
  isError,
  dispatcherOnly = false,
}: CampaignUsageChartProps) {
  const visible = (campaigns ?? []).filter(
    (campaign) => !dispatcherOnly || campaign.allowDispatcherGrant,
  );
  const usage = campaignUsage(visible);
  const granted = usage.reduce((sum, row) => sum + row.value, 0);
  const rows = usage.map((row) => ({
    key: row.key,
    label: row.label,
    value: row.value,
    note:
      row.limit > 0
        ? `${row.value}/${row.limit} · ${Math.round(row.ratio * 100)}%`
        : `${row.value} lượt`,
  }));

  return (
    <StaffChartCard
      title={
        dispatcherOnly
          ? "Hạn mức voucher được phát"
          : "Lượt phát theo chiến dịch"
      }
      subtitle="Các chiến dịch đang chạy, nhiều lượt nhất trước"
      isPending={isPending}
      empty={
        isError
          ? "Không tải được chiến dịch voucher."
          : rows.length === 0
            ? "Chưa có chiến dịch nào đang chạy."
            : null
      }
      aside={<ChartHeadline value={String(granted)} caption="lượt đã phát" />}
    >
      <LabeledBarRows
        rows={rows}
        label={rows.map((row) => `${row.label}: ${row.note}`).join("; ")}
      />
    </StaffChartCard>
  );
}
