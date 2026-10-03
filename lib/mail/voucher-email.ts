// Vietnamese "new voucher" message. Rendered inside the shared
// email-shell card; every interpolated value is escaped.
import { siteUrl } from "@/lib/seo/site";
import { emailShell } from "./email-shell";

export type VoucherEmailContent = {
  subject: string;
  text: string;
  html: string;
};

export type VoucherGrantedEmailInput = {
  campaignName: string;
  discountLabel: string;
  minOrderLabel: string | null;
  expiresLabel: string | null;
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function buildVoucherGrantedEmail(
  input: VoucherGrantedEmailInput,
): VoucherEmailContent {
  const name = input.campaignName.trim() || "Ưu đãi mới";
  const subject = `Bạn nhận được khuyến mãi mới: ${name}`;
  const walletUrl = `${siteUrl()}/vouchers`;

  const text = [
    "Xin chào,",
    "",
    `Bạn vừa nhận được voucher "${name}" (${input.discountLabel}).`,
    ...(input.minOrderLabel ? [input.minOrderLabel] : []),
    ...(input.expiresLabel ? [input.expiresLabel] : []),
    "",
    "Voucher đã nằm trong ví của tài khoản này và tự trừ ở bước thanh toán.",
    "",
    `Mở ví voucher: ${walletUrl}`,
    "",
    "Nếu bạn không thực hiện hoạt động nào gần đây, hãy bỏ qua email.",
    "",
    "FlashWrench",
  ].join("\n");

  const extraRows = [input.minOrderLabel, input.expiresLabel]
    .filter((line): line is string => Boolean(line))
    .map(
      (line) =>
        `<tr><td style="padding:10px 0 0;font-size:11px;font-weight:600;letter-spacing:0.06em;text-transform:uppercase;color:#b45309;">Điều kiện</td></tr>
<tr><td style="padding:2px 0 0;font-size:15px;line-height:1.5;font-weight:500;color:#18181b;">${escapeHtml(line)}</td></tr>`,
    )
    .join("");

  const bodyHtml = `
        <tr><td style="padding:10px 28px 0;">
          <p style="margin:0;font-size:15px;line-height:1.6;color:#3f3f46;">Bạn vừa nhận được voucher <strong style="font-weight:600;color:#18181b;">${escapeHtml(name)}</strong> — ${escapeHtml(input.discountLabel)}.</p>
        </td></tr>
        <tr><td style="padding:16px 28px 18px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#fafafa;border:1px solid #e4e4e7;border-radius:12px;">
            <tr><td style="padding:14px 18px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr><td style="padding:0;font-size:11px;font-weight:600;letter-spacing:0.06em;text-transform:uppercase;color:#b45309;">Mức giảm</td></tr>
                <tr><td style="padding:2px 0 0;font-size:15px;line-height:1.5;font-weight:500;color:#18181b;">${escapeHtml(input.discountLabel)}</td></tr>
                ${extraRows}
              </table>
            </td></tr>
          </table>
        </td></tr>
        <tr><td align="center" style="padding:22px 28px 0;">
          <a href="${escapeHtml(walletUrl)}" style="display:inline-block;padding:13px 32px;background:#18181b;color:#fbbf24;font-size:14px;font-weight:700;text-decoration:none;border-radius:999px;">Mở ví voucher</a>
        </td></tr>
        <tr><td align="center" style="padding:12px 28px 0;">
          <p style="margin:0;font-size:12px;line-height:1.6;color:#a1a1aa;word-break:break-all;">${escapeHtml(walletUrl)}</p>
        </td></tr>`;

  const html = emailShell({
    heading: "Bạn nhận được khuyến mãi mới",
    bodyHtml,
    footHtml:
      '<p style="margin:0 0 8px;font-size:13px;line-height:1.6;color:#71717a;">Voucher gắn riêng cho tài khoản này, không chia sẻ được.</p>',
  });

  return { subject, text, html };
}
