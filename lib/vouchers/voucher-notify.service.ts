// Fire-and-forget mail after a wallet lands on an account (auto-rule or
// staff grant). A send failure must never break a grant that already
// persisted — the wallet is already visible over realtime — so this module
// never throws and every call resolves through a catch-and-log path.
import { findUserById } from "@/lib/auth/user.repository";
import { mailLogoAttachments } from "@/lib/mail/email-shell";
import { isMailConfigured } from "@/lib/mail/mail.config";
import { sendMail } from "@/lib/mail/mailer.service";
import { buildVoucherGrantedEmail } from "@/lib/mail/voucher-email";

export type VoucherGrantNotice = {
  campaignName: string;
  discountType: string | null;
  discountValue: number | null;
  maxDiscount: number | null;
  minOrder: number | null;
  expiresAt: Date | null;
};

function formatVnd(value: number): string {
  return `${new Intl.NumberFormat("vi-VN").format(value)}đ`;
}

function discountLabel(grant: VoucherGrantNotice): string {
  if (grant.discountType === "percent") {
    const value = Math.max(0, Math.trunc(grant.discountValue ?? 0));
    const cap = Math.max(0, Math.trunc(grant.maxDiscount ?? 0));
    return cap > 0
      ? `Giảm ${value}% (tối đa ${formatVnd(cap)})`
      : `Giảm ${value}%`;
  }
  if (grant.discountType === "free_service") return "Miễn phí công sửa";
  return `Giảm ${formatVnd(Math.max(0, Math.trunc(grant.discountValue ?? 0)))}`;
}

function formatDate(value: Date | null): string | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return `Hạn dùng đến ${date.toLocaleDateString("vi-VN")}`;
}

export function notifyVoucherGranted(
  userId: string,
  grant: VoucherGrantNotice,
): void {
  void (async () => {
    try {
      if (!isMailConfigured()) return;
      const user = await findUserById(userId).catch(() => null);
      const to = typeof user?.email === "string" ? user.email.trim() : "";
      if (!to) return;
      const content = buildVoucherGrantedEmail({
        campaignName: grant.campaignName,
        discountLabel: discountLabel(grant),
        minOrderLabel:
          (grant.minOrder ?? 0) > 0
            ? `Áp dụng cho đơn từ ${formatVnd(grant.minOrder ?? 0)}`
            : null,
        expiresLabel: formatDate(grant.expiresAt),
      });
      await sendMail({
        to,
        ...content,
        attachments: mailLogoAttachments(),
      });
    } catch (error) {
      console.warn(
        "[mail] voucher grant notice failed:",
        error instanceof Error ? error.message : error,
      );
    }
  })();
}
