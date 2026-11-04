"use client";

import { useState } from "react";
import { useClaimVoucherCode } from "@/hooks/useVoucherCode";
import type { VoucherWallet } from "@/lib/vouchers/voucher.types";
import type { VoucherKind } from "@/lib/vouchers/voucher-pick";
import { VoucherCodeApiError } from "@/services/voucher-code.api";

type ClaimOfferButtonProps = {
  code: string;
  kind: VoucherKind;
  subtotal: number;
  campaignName: string;
  disabled?: boolean;
  onClaimed: (wallet: VoucherWallet) => void;
};

// One-tap "Nhận & áp dụng" for a claimable typed code. Claims through the
// same API the code field uses — never auto-fires, a claim burns a grant.
export function ClaimOfferButton({
  code,
  kind,
  subtotal,
  campaignName,
  disabled = false,
  onClaimed,
}: ClaimOfferButtonProps) {
  const claim = useClaimVoucherCode();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="flex shrink-0 flex-col items-end gap-1">
      <button
        type="button"
        aria-label={`Nhận và áp dụng ${campaignName}`}
        disabled={disabled || claim.isPending}
        onClick={() => {
          setError(null);
          claim.mutate(
            { code, kind, subtotal },
            {
              onSuccess: (data) => onClaimed(data.wallet),
              onError: (err) =>
                setError(
                  err instanceof VoucherCodeApiError
                    ? err.message
                    : "Không áp được mã. Vui lòng thử lại.",
                ),
            },
          );
        }}
        className="flex min-h-[44px] items-center justify-center rounded-xl px-3 py-2 text-xs font-semibold whitespace-nowrap transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 disabled:cursor-not-allowed disabled:opacity-60 motion-safe:active:scale-[0.99] bg-[#1D4ED8] text-white hover:bg-[#1E40AF] dark:bg-[#60A5FA] dark:text-[#111111] dark:hover:bg-[#93C5FD]"
      >
        {claim.isPending ? "Đang nhận…" : "Nhận & áp dụng"}
      </button>
      {error && (
        <p
          role="alert"
          className="max-w-48 text-right text-xs font-medium text-red-600 dark:text-red-400"
        >
          {error}
        </p>
      )}
    </div>
  );
}
