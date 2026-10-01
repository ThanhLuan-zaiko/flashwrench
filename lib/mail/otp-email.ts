// Vietnamese OTP message. Rendered inside the shared email-shell card; only
// the code (six digits) and a masked address are interpolated, so there is
// nothing to escape beyond those two.
import { emailShell, MAIL_BRAND } from "./email-shell";

export type OtpEmailContent = { subject: string; text: string; html: string };

const BRAND = MAIL_BRAND;
const CODE_TTL_MINUTES = 5;

export function maskEmail(email: string): string {
  const at = email.indexOf("@");
  if (at <= 1) return email;
  const local = email.slice(0, at);
  const domain = email.slice(at);
  // Keep the first two characters so the visitor can recognise the address
  // without the template echoing it back in full.
  return `${local.slice(0, 2)}${"*".repeat(Math.max(3, local.length - 2))}${domain}`;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function buildOtpEmail(
  email: string,
  code: string,
  purposeLabel: string,
): OtpEmailContent {
  const masked = maskEmail(email);
  const subject = `Mã xác minh ${BRAND}: ${code}`;

  const text = [
    `Xin chào,`,
    ``,
    `Mã xác minh của bạn để ${purposeLabel} là:`,
    ``,
    `    ${code}`,
    ``,
    `Mã có hiệu lực trong ${CODE_TTL_MINUTES} phút và chỉ dùng được một lần.`,
    ``,
    `Nếu bạn không yêu cầu mã này, hãy bỏ qua email — không cần làm gì cả.`,
    ``,
    `${BRAND}`,
  ].join("\n");

  const bodyHtml = `
        <tr><td style="padding:10px 28px 0;">
          <p style="margin:0;font-size:15px;line-height:1.6;color:#3f3f46;">Bạn đã yêu cầu mã để ${escapeHtml(
            purposeLabel,
          )}. Nhập mã bên dưới vào trang tra cứu:</p>
        </td></tr>
        <tr><td align="center" style="padding:20px 28px 0;">
          <table role="presentation" cellpadding="0" cellspacing="0" style="background:#fffbeb;border:1px solid #fde68a;border-radius:12px;">
            <tr><td style="padding:16px 34px;">
              <span style="font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:34px;font-weight:700;letter-spacing:0.28em;color:#92400e;">${escapeHtml(
                code,
              )}</span>
            </td></tr>
          </table>
        </td></tr>
        <tr><td align="center" style="padding:14px 28px 0;">
          <p style="margin:0;font-size:13px;line-height:1.6;color:#71717a;">Mã có hiệu lực trong ${CODE_TTL_MINUTES} phút và chỉ dùng được một lần.</p>
        </td></tr>`;

  const html = emailShell({
    heading: "Xác minh địa chỉ email",
    bodyHtml,
    footHtml: `<p style="margin:0 0 8px;font-size:13px;line-height:1.6;color:#71717a;">Mã được gửi tới <strong style="font-weight:600;color:#3f3f46;">${escapeHtml(
      masked,
    )}</strong>.</p>
              <p style="margin:0;font-size:13px;line-height:1.6;color:#71717a;">Nếu bạn không yêu cầu mã này, hãy bỏ qua email — không cần làm gì cả.</p>`,
  });

  return { subject, text, html };
}
