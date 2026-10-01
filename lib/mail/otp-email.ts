// Vietnamese OTP message. Email clients ignore external stylesheets, so the
// markup is inline-styled and table-based on purpose. Only the code (six
// digits) and a masked address are interpolated, so there is nothing to
// escape here.
export type OtpEmailContent = { subject: string; text: string; html: string };

const BRAND = "FlashWrench";
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

  const html = `<!doctype html>
<html lang="vi"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:24px 12px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border:1px solid #e4e4e7;border-radius:16px;overflow:hidden;">
        <tr><td style="padding:24px 28px 8px;">
          <p style="margin:0;font-size:13px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;color:#71717a;">${BRAND}</p>
          <h1 style="margin:8px 0 0;font-size:20px;line-height:1.4;font-weight:600;color:#18181b;">Xác minh địa chỉ email</h1>
        </td></tr>
        <tr><td style="padding:8px 28px 0;">
          <p style="margin:0;font-size:15px;line-height:1.6;color:#3f3f46;">Bạn đã yêu cầu mã để ${escapeHtml(purposeLabel)}. Nhập mã bên dưới vào trang tra cứu:</p>
        </td></tr>
        <tr><td align="center" style="padding:20px 28px 0;">
          <div style="display:inline-block;padding:16px 28px;border:1px solid #e4e4e7;border-radius:12px;background:#fafafa;">
            <span style="font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:34px;font-weight:700;letter-spacing:0.28em;color:#18181b;">${escapeHtml(code)}</span>
          </div>
        </td></tr>
        <tr><td style="padding:20px 28px 0;">
          <p style="margin:0;font-size:13px;line-height:1.6;color:#71717a;">Mã có hiệu lực trong ${CODE_TTL_MINUTES} phút và chỉ dùng được một lần.</p>
        </td></tr>
        <tr><td style="padding:16px 28px 24px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #e4e4e7;">
            <tr><td style="padding-top:16px;">
              <p style="margin:0;font-size:13px;line-height:1.6;color:#71717a;">Mã được gửi tới <strong style="font-weight:600;color:#3f3f46;">${escapeHtml(masked)}</strong>.</p>
              <p style="margin:8px 0 0;font-size:13px;line-height:1.6;color:#71717a;">Nếu bạn không yêu cầu mã này, hãy bỏ qua email — không cần làm gì cả.</p>
            </td></tr>
          </table>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;

  return { subject, text, html };
}
