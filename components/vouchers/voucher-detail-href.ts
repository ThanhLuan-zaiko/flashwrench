// Detail URLs for voucher advertising. English path segments only:
// wallets live under /vouchers/w, public campaigns under /vouchers/c,
// so neither clashes with the /vouchers/page/N pager segment.
export function walletDetailHref(walletId: string): string {
  return `/vouchers/w/${encodeURIComponent(walletId)}`;
}

export function campaignDetailHref(slug: string): string {
  return `/vouchers/c/${encodeURIComponent(slug.trim().toLowerCase())}`;
}
