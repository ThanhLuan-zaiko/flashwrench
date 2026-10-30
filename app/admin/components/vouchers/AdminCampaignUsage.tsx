"use client";

import { CampaignUsageChart } from "@/components/charts/CampaignUsageChart";
import { useAdminCampaigns } from "@/hooks/useVouchers";

// Admin voucher page chart: same campaigns query as the board below it
// (shared cache key), so edits and grants redraw the bars in place.
export function AdminCampaignUsage() {
  const campaigns = useAdminCampaigns();
  return (
    <CampaignUsageChart
      campaigns={campaigns.data}
      isPending={campaigns.isPending}
      isError={campaigns.isError}
    />
  );
}
