import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Ví voucher",
  description: "Voucher giảm giá gắn với tài khoản của bạn.",
};

// Metadata-only leaf: the /vouchers layout shell renders the board and
// reads the page segment itself.
export default function VouchersPage() {
  return null;
}
