import type { PublicVoucherCampaign } from "@/lib/vouchers/voucher.types";

// Props shared by the desktop expanding strip and the phone accordion. Both
// render the same campaigns and drive the same carousel state.
export type PromoListProps = {
  campaigns: PublicVoucherCampaign[];
  index: number;
  showControls: boolean;
  announce: boolean;
  onPick: (index: number) => void;
  onPrev: () => void;
  onNext: () => void;
};
