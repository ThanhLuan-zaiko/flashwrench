"use client";

import { useVoucherRealtime } from "@/hooks/useVoucherRealtime";
import { useAdminCampaigns, useToggleCampaign } from "@/hooks/useVouchers";
import { CampaignCard } from "./CampaignCard";
import { CampaignCreateForm } from "./CampaignCreateForm";

export function AdminVoucherBoard() {
  useVoucherRealtime(undefined, true);
  const campaigns = useAdminCampaigns(true);
  const toggle = useToggleCampaign();

  if (campaigns.isPending) {
    return (
      <p className="rounded-2xl border border-zinc-200 p-4 text-sm text-zinc-500 motion-safe:animate-pulse dark:border-zinc-800 dark:text-zinc-400">
        Đang tải chiến dịch…
      </p>
    );
  }
  if (campaigns.isError) {
    return (
      <p className="rounded-2xl border border-zinc-200 p-4 text-sm dark:border-zinc-800">
        Không tải được chiến dịch.
      </p>
    );
  }
  const items = campaigns.data ?? [];
  return (
    <div className="flex flex-col gap-4">
      <CampaignCreateForm onCreated={() => campaigns.refetch()} />
      {items.length === 0 ? (
        <p className="rounded-2xl border border-zinc-200 p-4 text-sm text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
          Chưa có chiến dịch nào. Hãy tạo chiến dịch đầu tiên ở trên.
        </p>
      ) : (
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:gap-4 lg:grid-cols-3">
          {items.map((campaign) => (
            <li key={campaign.id}>
              <CampaignCard
                campaign={campaign}
                toggling={toggle.isPending}
                onToggle={(item) =>
                  toggle.mutate({
                    id: item.id,
                    code: item.code,
                    isActive: !item.isActive,
                  })
                }
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
