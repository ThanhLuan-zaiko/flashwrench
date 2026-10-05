// Fetch layer for typed redeem codes. Components never call fetch
// directly — hooks wrap these calls with TanStack Query.

import type { VoucherFieldErrors } from "@/lib/vouchers/voucher.types";
import type {
  ClaimableCodeCampaign,
  ClaimVoucherCodeInput,
  ClaimVoucherCodeResult,
  RedeemCodeVisibility,
} from "@/lib/vouchers/voucher-code.types";
import type { VoucherKind } from "@/lib/vouchers/voucher-pick";

export class VoucherCodeApiError extends Error {
  status: number;
  errors: VoucherFieldErrors;
  constructor(status: number, errors: VoucherFieldErrors) {
    super(
      errors.redeemCode ?? errors.form ?? "Không áp được mã. Vui lòng thử lại.",
    );
    this.name = "VoucherCodeApiError";
    this.status = status;
    this.errors = errors;
  }
}

async function readErrors(response: Response): Promise<VoucherFieldErrors> {
  try {
    const body = (await response.json()) as { errors?: VoucherFieldErrors };
    return body.errors ?? { form: "Có lỗi xảy ra. Vui lòng thử lại." };
  } catch {
    return { form: "Có lỗi xảy ra. Vui lòng thử lại." };
  }
}

// Customer presses "Áp dụng": the server claims one wallet from the
// campaign owning this code (or returns the reusable one already held).
export async function claimVoucherCode(
  input: ClaimVoucherCodeInput,
): Promise<ClaimVoucherCodeResult> {
  const response = await fetch("/api/vouchers/claim", {
    method: "POST",
    credentials: "include",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!response.ok) {
    throw new VoucherCodeApiError(response.status, await readErrors(response));
  }
  return (await response.json()) as ClaimVoucherCodeResult;
}

// What the public campaign page may show this signed-in customer: the
// code only when they are still eligible to claim it.
export async function fetchCampaignRedeemCode(
  slug: string,
): Promise<RedeemCodeVisibility> {
  const response = await fetch(
    `/api/vouchers/campaign-code/${encodeURIComponent(slug)}`,
    { credentials: "include" },
  );
  if (!response.ok) {
    throw new VoucherCodeApiError(response.status, await readErrors(response));
  }
  return (await response.json()) as RedeemCodeVisibility;
}

// Redeem-code campaigns this customer could still claim for the given
// order kind — the "Mã có thể nhận" list inside voucher pickers.
export async function fetchClaimableCodes(
  kind: VoucherKind | null,
): Promise<ClaimableCodeCampaign[]> {
  const suffix = kind === null ? "" : `?kind=${kind}`;
  const response = await fetch(`/api/vouchers/claimable${suffix}`, {
    credentials: "include",
  });
  if (!response.ok) {
    throw new VoucherCodeApiError(response.status, await readErrors(response));
  }
  const body = (await response.json()) as { items: ClaimableCodeCampaign[] };
  return body.items;
}
