"use client";

import Link from "next/link";
import { useState } from "react";
import {
  FiGift,
  FiPlus,
  FiSend,
  FiTrash2,
  FiUserCheck,
  FiZap,
} from "react-icons/fi";
import { BigTypeHeader } from "@/components/bento/BigTypeHeader";
import { useBentoReveal } from "@/hooks/useBentoReveal";
import { useVoucherRealtime } from "@/hooks/useVoucherRealtime";
import { useAdminCampaigns } from "@/hooks/useVouchers";
import type { VoucherCampaign } from "@/lib/vouchers/voucher.types";
import { BentoCard } from "../bento/BentoCard";
import type { ServiceStat } from "../bento/ServicesStatCard";
import { ServicesStatCard } from "../bento/ServicesStatCard";
import { CampaignDeleteDialog } from "./CampaignDeleteDialog";
import { CampaignDialog, type CampaignDialogState } from "./CampaignDialog";
import { CampaignList } from "./CampaignList";
import { useCampaignRowActions } from "./useCampaignRowActions";
import { VOUCHER_TABS, type VoucherTab } from "./voucher-tabs";

function buildStats(items: VoucherCampaign[]): ServiceStat[] {
  const live = items.filter((item) => !item.isDeleted);
  const running = live.filter((item) => item.isActive).length;
  const granted = live.reduce((sum, item) => sum + item.grantedCount, 0);
  const dispatchable = live.filter((item) => item.allowDispatcherGrant).length;
  return [
    {
      id: "total",
      label: "Chiến dịch",
      value: String(live.length),
      hint: "mọi trạng thái",
      icon: FiGift,
    },
    {
      id: "running",
      label: "Đang chạy",
      value: String(running),
      hint: "sẵn sàng phát voucher",
      icon: FiZap,
    },
    {
      id: "granted",
      label: "Đã phát",
      value: new Intl.NumberFormat("vi-VN").format(granted),
      hint: "lượt voucher vào ví khách",
      icon: FiSend,
    },
    {
      id: "dispatchable",
      label: "Điều phối phát được",
      value: String(dispatchable),
      hint: "trong hạn mức đã cấp",
      icon: FiUserCheck,
    },
  ];
}

// Admin voucher console: same bento grammar as the catalog pages —
// big-type header, stat row, one management card with a tab bar and a
// divided list. The active tab comes from the route (one URL per tab) so
// links stay shareable and the browser back button works.
export function AdminVoucherBoard({ tab }: { tab: VoucherTab }) {
  const rootRef = useBentoReveal<HTMLDivElement>();
  useVoucherRealtime(undefined, true);
  const campaigns = useAdminCampaigns(true);
  const actions = useCampaignRowActions();
  const [dialog, setDialog] = useState<CampaignDialogState | null>(null);
  const trashMode = tab === "trash";

  const items = campaigns.data ?? [];
  const liveItems = items.filter((item) => !item.isDeleted);
  const trashItems = items.filter((item) => item.isDeleted);
  const shown = trashMode ? trashItems : liveItems;
  const trashCount = trashItems.length;
  const stats = buildStats(campaigns.isSuccess ? items : []);

  return (
    <div ref={rootRef} className="flex flex-col gap-6 md:gap-8">
      <BigTypeHeader
        eyebrow="Ưu đãi voucher"
        title="Voucher đúng người, đúng lúc."
        subtitle="Admin tạo và giám sát chiến dịch; điều phối phát trong hạn mức, mọi thay đổi tự cập nhật qua websocket."
        level={1}
      />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:gap-4 lg:grid-cols-4">
        {stats.map((stat) => (
          <ServicesStatCard key={stat.id} stat={stat} />
        ))}
        <BentoCard
          label="Quản lý chiến dịch"
          className="sm:col-span-2 lg:col-span-4"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div
              role="tablist"
              aria-label="Chọn nhóm chiến dịch"
              className="flex flex-wrap gap-1.5"
            >
              {VOUCHER_TABS.map((t) => {
                const TabIcon = t.icon;
                return (
                  <Link
                    key={t.id}
                    href={t.href}
                    scroll={false}
                    prefetch
                    role="tab"
                    aria-selected={tab === t.id}
                    aria-current={tab === t.id ? "page" : undefined}
                    className={`flex min-h-[44px] items-center gap-1.5 rounded-xl border px-4 py-2 text-sm font-semibold transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 motion-safe:active:scale-[0.99] ${
                      tab === t.id
                        ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
                        : "border-zinc-300 text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
                    }`}
                  >
                    <TabIcon aria-hidden="true" className="h-4 w-4 shrink-0" />
                    {t.id === "trash" ? `${t.label} (${trashCount})` : t.label}
                  </Link>
                );
              })}
            </div>
            {!trashMode ? (
              <button
                type="button"
                onClick={() => setDialog({ mode: "create" })}
                className="flex min-h-[44px] items-center gap-1.5 rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white transition-colors duration-200 hover:bg-zinc-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 motion-safe:active:scale-[0.99] dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
              >
                <FiPlus aria-hidden="true" className="h-4 w-4" />
                Thêm chiến dịch
              </button>
            ) : (
              <p className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
                <FiTrash2 aria-hidden="true" className="h-4 w-4" />
                Khôi phục hoặc xóa vĩnh viễn
              </p>
            )}
          </div>
          <div role="tabpanel" className="mt-4">
            <CampaignList
              items={shown}
              isPending={campaigns.isPending}
              isError={campaigns.isError}
              pendingId={actions.pendingId}
              trashMode={trashMode}
              onEdit={(item) => setDialog({ mode: "edit", item })}
              onToggle={actions.toggleCampaign}
              onSoftDelete={actions.openSoft}
              onHardDelete={actions.openHard}
              onRestore={actions.restoreCampaign}
              onRetry={() => void campaigns.refetch()}
            />
          </div>
        </BentoCard>
      </div>

      {dialog && (
        <CampaignDialog
          key={dialog.mode === "edit" ? dialog.item.id : "create"}
          dialog={dialog}
          onClose={() => setDialog(null)}
        />
      )}
      <CampaignDeleteDialog
        target={actions.deleteTarget}
        confirmText={actions.confirmText}
        pending={actions.deletePending}
        error={actions.deleteError}
        onConfirmText={actions.setConfirmText}
        onClose={actions.closeDelete}
        onConfirm={actions.confirmDelete}
      />
    </div>
  );
}
