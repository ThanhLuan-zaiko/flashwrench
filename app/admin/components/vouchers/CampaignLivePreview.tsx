"use client";

import { PromoCarousel } from "@/components/promotions/PromoCarousel";
import type { PublicVoucherCampaign } from "@/lib/vouchers/voucher.types";
import type { CampaignFormState } from "./campaign-form";

type CampaignLivePreviewProps = {
  form: CampaignFormState;
  gallery: string[];
};

function toNumber(value: string, fallback: number): number {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : fallback;
}

function toIsoOrNull(local: string): string | null {
  const trimmed = local.trim();
  if (!trimmed) return null;
  const date = new Date(trimmed);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

// Live customer preview inside the admin dialog: staff check the banner
// shape before saving. The card is the same component customers see,
// wrapped inert so its CTA cannot navigate away and discard the draft.
export function CampaignLivePreview({
  form,
  gallery,
}: CampaignLivePreviewProps) {
  const discountType =
    form.discountType === "percent" || form.discountType === "free_service"
      ? form.discountType
      : "fixed";
  const scope =
    form.scope === "order" || form.scope === "booking" ? form.scope : "all";
  const preview: PublicVoucherCampaign = {
    id: "preview",
    slug: form.slug.trim().toLowerCase(),
    name: form.name.trim() || "Tên chiến dịch",
    description: form.description.trim(),
    imageUrl: gallery[0] ?? "",
    images: gallery,
    discountType,
    discountValue: toNumber(form.discountValue, 0),
    maxDiscount: toNumber(form.maxDiscount, 0),
    minOrder: toNumber(form.minOrder, 0),
    scope,
    startAt: toIsoOrNull(form.startAt),
    endAt: toIsoOrNull(form.endAt),
    totalLimit: toNumber(form.totalLimit, 0),
    grantedCount: 0,
    earn: [],
  };
  return (
    <div className="sm:col-span-2">
      <p className="text-xs font-semibold tracking-wide text-zinc-500 uppercase dark:text-zinc-400">
        Xem trước cho khách
      </p>
      <div inert className="mt-2">
        <PromoCarousel campaigns={[preview]} />
      </div>
    </div>
  );
}
