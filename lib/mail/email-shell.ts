// Shared HTML shell for every transactional mail: dark brand header with the
// CID-embedded logo, amber accent strip, carded body, muted footer. Email
// clients ignore external stylesheets and remote images get blocked by
// default, so everything is inline-styled tables and the logo rides as a CID
// attachment instead of a remote URL.
import { existsSync } from "node:fs";
import path from "node:path";
import type { MailAttachment } from "./mailer.types";

export const MAIL_LOGO_CID = "flashwrench-logo";
export const MAIL_BRAND = "FlashWrench";

// Dedicated downscaled copy (~16 KB) generated from asset/flashwrench.png —
// embedding the full 430 KB brand asset into every mail would be wasteful.
const LOGO_PATH = path.join(process.cwd(), "asset", "mail-logo.png");

export function mailLogoAvailable(): boolean {
  return existsSync(LOGO_PATH);
}

// Attachments ride on the MailMessage; the html references cid:MAIL_LOGO_CID.
// Empty when the asset is missing so a deploy without it still sends mail
// (the <img> degrades to a broken icon, never a failed send).
export function mailLogoAttachments(): MailAttachment[] {
  return mailLogoAvailable()
    ? [{ filename: "flashwrench.png", path: LOGO_PATH, cid: MAIL_LOGO_CID }]
    : [];
}

export type EmailShellInput = {
  heading: string;
  /** Already-escaped inner rows, each a full `<tr><td>…</td></tr>` block. */
  bodyHtml: string;
  /** Extra footer line(s) above the fixed no-reply disclaimer. */
  footHtml?: string;
};

export function emailShell(input: EmailShellInput): string {
  const logoCell = mailLogoAvailable()
    ? `<td style="padding-right:14px;vertical-align:middle;">
            <img src="cid:${MAIL_LOGO_CID}" width="51" height="40" alt="${MAIL_BRAND}" style="display:block;width:51px;height:40px;border-radius:10px;"/>
          </td>`
    : "";

  return `<!doctype html>
<html lang="vi"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:28px 12px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border:1px solid #e4e4e7;border-radius:16px;overflow:hidden;">
        <tr><td style="background:#18181b;padding:18px 28px;">
          <table role="presentation" cellpadding="0" cellspacing="0"><tr>
            ${logoCell}
            <td style="vertical-align:middle;">
              <p style="margin:0;font-size:16px;font-weight:700;letter-spacing:0.08em;color:#ffffff;">${MAIL_BRAND.toUpperCase()}</p>
              <p style="margin:2px 0 0;font-size:12px;color:#a1a1aa;">Sửa xe lưu động tận nơi</p>
            </td>
          </tr></table>
        </td></tr>
        <tr><td style="height:4px;line-height:4px;font-size:0;background:#f59e0b;">&nbsp;</td></tr>
        <tr><td style="padding:22px 28px 0;">
          <h1 style="margin:0;font-size:20px;line-height:1.4;font-weight:600;color:#18181b;">${
            input.heading
          }</h1>
        </td></tr>
        ${input.bodyHtml}
        <tr><td style="padding:18px 28px 24px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #e4e4e7;">
            <tr><td style="padding-top:16px;">
              ${input.footHtml ?? ""}
              <p style="margin:0;font-size:12px;line-height:1.6;color:#a1a1aa;">Email tự động từ ${MAIL_BRAND} — vui lòng không trả lời.</p>
            </td></tr>
          </table>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}
