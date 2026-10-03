import type { Metadata } from "next";
import { getPublicCampaignBySlug } from "@/lib/vouchers/voucher-public.service";

type DetailParams = { params: Promise<{ slug: string }> };

const FALLBACK_TITLE = "Ưu đãi | FlashWrench";

// Per-campaign title from the live public feed so shared links show
// what they point to. Best-effort: any failure falls back to generic.
export async function generateMetadata({
  params,
}: DetailParams): Promise<Metadata> {
  try {
    const { slug } = await params;
    const result = await getPublicCampaignBySlug(slug);
    if (result.ok) {
      return {
        title: `${result.data.name} | FlashWrench`,
        description:
          result.data.description ||
          "Voucher giảm giá gắn với tài khoản của bạn.",
      };
    }
  } catch {
    // Fall through to the generic title below.
  }
  return { title: FALLBACK_TITLE };
}

// Metadata-only: the detail screen lives in the /vouchers layout shell.
export default function VoucherCampaignDetailPage() {
  return null;
}
