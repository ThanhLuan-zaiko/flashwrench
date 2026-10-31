// Vietnamese maintenance reminder. Carries only the vehicle name and the
// due text — never the plate, so a forwarded email reveals little.
import { siteUrl } from "@/lib/seo/site";
import { emailShell } from "./email-shell";
import type { VoucherEmailContent } from "./voucher-email";

export type MaintenanceEmailInput = {
  vehicleName: string;
  /** Full sentence fragment, e.g. "vào khoảng 03/11/2026". */
  dueText: string;
  unsubscribeUrl: string;
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function buildMaintenanceReminderEmail(
  input: MaintenanceEmailInput,
): VoucherEmailContent {
  const vehicle = input.vehicleName.trim() || "xe của bạn";
  const bookUrl = `${siteUrl()}/booking`;
  const subject = `Đến hạn bảo dưỡng ${vehicle}`;

  const text = [
    "Xin chào,",
    "",
    `${vehicle} đến hạn bảo dưỡng định kỳ ${input.dueText}.`,
    "",
    `Đặt lịch: ${bookUrl}`,
    "",
    "Nếu xe đã được bảo dưỡng gần đây, bạn có thể bỏ qua email này.",
    `Không muốn nhận nhắc bảo dưỡng nữa: ${input.unsubscribeUrl}`,
    "",
    "FlashWrench",
  ].join("\n");

  const bodyHtml = `
        <tr><td style="padding:10px 28px 0;">
          <p style="margin:0;font-size:15px;line-height:1.6;color:#3f3f46;">
            <strong style="font-weight:600;color:#18181b;">${escapeHtml(vehicle)}</strong>
            đến hạn bảo dưỡng định kỳ ${escapeHtml(input.dueText)}.
          </p>
        </td></tr>
        <tr><td align="center" style="padding:22px 28px 0;">
          <a href="${escapeHtml(bookUrl)}" style="display:inline-block;padding:13px 32px;background:#18181b;color:#fbbf24;font-size:14px;font-weight:700;text-decoration:none;border-radius:999px;">Đặt lịch bảo dưỡng</a>
        </td></tr>`;

  const html = emailShell({
    heading: "Đến hạn bảo dưỡng",
    bodyHtml,
    footHtml: `<p style="margin:0 0 8px;font-size:13px;line-height:1.6;color:#71717a;">Nếu xe đã được bảo dưỡng gần đây, bạn có thể bỏ qua email này. <a href="${escapeHtml(input.unsubscribeUrl)}" style="color:#71717a;">Không nhận nhắc bảo dưỡng nữa</a>.</p>`,
  });

  return { subject, text, html };
}
