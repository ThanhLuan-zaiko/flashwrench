import type { PublicVoucherCampaign } from "@/lib/vouchers/voucher.types";
import { CampaignRedeemCode } from "./CampaignRedeemCode";
import { CampaignShareButton } from "./CampaignShareButton";
import {
  promoConditionLabel,
  promoExpiryLabel,
  promoScopeLabel,
} from "./promo-format";

function formatDate(iso: string | null): string {
  if (!iso) return "Không giới hạn";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "Không giới hạn";
  return date.toLocaleDateString("vi-VN");
}

function TermRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-2">
      <dt className="text-xs text-zinc-500 dark:text-zinc-400">{label}</dt>
      <dd className="text-right text-xs font-semibold text-zinc-800 dark:text-zinc-200">
        {value}
      </dd>
    </div>
  );
}

// Terms card for a public campaign: the rules at a glance, the viewer's own
// redeem code when one applies, and the share entry point.
export function CampaignTerms({
  campaign,
}: {
  campaign: PublicVoucherCampaign;
}) {
  const remaining =
    campaign.totalLimit > 0
      ? Math.max(0, campaign.totalLimit - campaign.grantedCount)
      : null;

  return (
    <section
      data-reveal
      aria-label="Điều kiện ưu đãi"
      className="flex flex-col gap-3 rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950"
    >
      <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
        Điều kiện áp dụng
      </h2>
      <dl className="divide-y divide-zinc-100 dark:divide-zinc-800">
        <TermRow label="Áp dụng cho" value={promoScopeLabel(campaign.scope)} />
        <TermRow label="Điều kiện đơn" value={promoConditionLabel(campaign)} />
        <TermRow label="Bắt đầu" value={formatDate(campaign.startAt)} />
        <TermRow label="Kết thúc" value={promoExpiryLabel(campaign)} />
        {remaining !== null && (
          <TermRow
            label="Suất còn lại"
            value={`${remaining} / ${campaign.totalLimit}`}
          />
        )}
      </dl>
      <CampaignRedeemCode
        slug={campaign.slug}
        hasRedeemCode={campaign.hasRedeemCode}
      />
      <div>
        <CampaignShareButton slug={campaign.slug} />
      </div>
    </section>
  );
}
