// Vietnamese "request received" message for the three public intake flows
// (booking / rescue / spare-parts order). Rendered inside the shared
// email-shell card; every interpolated value is escaped.
import { siteUrl } from "@/lib/seo/site";
import { emailShell } from "./email-shell";

export type ConfirmationEmailContent = {
  subject: string;
  text: string;
  html: string;
};

export type ConfirmationKind = "booking" | "rescue" | "order";
export type ConfirmationDetail = { label: string; value: string };

export type ConfirmationEmailInput = {
  kind: ConfirmationKind;
  customerName: string | null;
  refId: string;
  details: ConfirmationDetail[];
  /** Absolute tracking URL; null when the flow has no public page yet. */
  trackUrl: string | null;
  /** Extra highlighted line under the details (e.g. the rescue hotline). */
  note?: string | null;
};

const BRAND = "FlashWrench";

const KIND_COPY: Record<
  ConfirmationKind,
  { noun: string; heading: string; intro: string; cta: string }
> = {
  booking: {
    noun: "lịch hẹn",
    heading: "Đã nhận lịch hẹn của bạn",
    intro:
      "FlashWrench đã nhận lịch hẹn và đang điều phối thợ phù hợp. Giữ liên lạc qua số điện thoại bạn đã cung cấp.",
    cta: "Theo dõi lịch hẹn",
  },
  rescue: {
    noun: "yêu cầu cứu hộ",
    heading: "Đã nhận yêu cầu cứu hộ",
    intro:
      "FlashWrench đã nhận yêu cầu cứu hộ của bạn. Điều phối viên sẽ gọi lại qua số điện thoại bạn đã cung cấp để xác nhận vị trí và báo giá.",
    cta: "Tra cứu yêu cầu",
  },
  order: {
    noun: "đơn hàng",
    heading: "Đã nhận đơn hàng của bạn",
    intro:
      "FlashWrench đã nhận đơn hàng và đang xử lý. Bạn sẽ nhận được cập nhật khi đơn chuyển sang giao hàng.",
    cta: "Theo dõi đơn hàng",
  },
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function buildConfirmationEmail(
  input: ConfirmationEmailInput,
): ConfirmationEmailContent {
  const copy = KIND_COPY[input.kind];
  const refLabel = `Mã ${copy.noun}`;
  const lookupUrl = `${siteUrl()}/lookup`;
  // Rescue has no public tracking page yet, so its call-to-action falls
  // back to the OTP lookup where the request still shows up by email.
  const actionUrl = input.trackUrl ?? lookupUrl;
  const actionLabel = input.trackUrl ? copy.cta : "Tra cứu bằng email";
  const subject = `${BRAND}: đã nhận ${copy.noun} của bạn`;

  const greeting = input.customerName
    ? `Xin chào ${input.customerName},`
    : "Xin chào,";

  const text = [
    greeting,
    "",
    copy.intro,
    "",
    `${refLabel}: ${input.refId}`,
    ...input.details.map((d) => `${d.label}: ${d.value}`),
    ...(input.note ? ["", input.note] : []),
    "",
    input.trackUrl
      ? `${copy.cta}: ${actionUrl}`
      : `Tra cứu ${copy.noun} bằng chính email này tại: ${lookupUrl}`,
    "",
    "Nếu bạn không thực hiện yêu cầu này, hãy bỏ qua email.",
    "",
    BRAND,
  ].join("\n");

  const detailRows = [{ label: refLabel, value: input.refId }, ...input.details]
    .map(
      (d, i) => `<tr><td style="padding:${
        i === 0 ? "0" : "10px"
      } 0 0;font-size:11px;font-weight:600;letter-spacing:0.06em;text-transform:uppercase;color:#b45309;">${escapeHtml(
        d.label,
      )}</td></tr>
<tr><td style="padding:2px 0 0;font-size:15px;line-height:1.5;font-weight:500;color:#18181b;">${escapeHtml(
        d.value,
      )}</td></tr>`,
    )
    .join("");

  const noteBlock = input.note
    ? `<tr><td style="padding:0 28px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#fffbeb;border:1px solid #fde68a;border-radius:10px;">
            <tr><td style="padding:10px 14px;font-size:13px;line-height:1.6;color:#92400e;">${escapeHtml(
              input.note,
            )}</td></tr>
          </table>
        </td></tr>`
    : "";

  const bodyHtml = `
        <tr><td style="padding:10px 28px 0;">
          <p style="margin:0;font-size:15px;line-height:1.6;color:#3f3f46;">${escapeHtml(
            greeting,
          )} ${escapeHtml(copy.intro)}</p>
        </td></tr>
        <tr><td style="padding:16px 28px 18px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#fafafa;border:1px solid #e4e4e7;border-radius:12px;">
            <tr><td style="padding:14px 18px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${detailRows}</table>
            </td></tr>
          </table>
        </td></tr>
        ${noteBlock}
        <tr><td align="center" style="padding:22px 28px 0;">
          <a href="${escapeHtml(
            actionUrl,
          )}" style="display:inline-block;padding:13px 32px;background:#18181b;color:#fbbf24;font-size:14px;font-weight:700;text-decoration:none;border-radius:999px;">${escapeHtml(
            actionLabel,
          )}</a>
        </td></tr>
        <tr><td align="center" style="padding:12px 28px 0;">
          <p style="margin:0;font-size:12px;line-height:1.6;color:#a1a1aa;word-break:break-all;">${escapeHtml(
            actionUrl,
          )}</p>
        </td></tr>`;

  const html = emailShell({
    heading: escapeHtml(copy.heading),
    bodyHtml,
    footHtml: `<p style="margin:0 0 8px;font-size:13px;line-height:1.6;color:#71717a;">Nếu bạn không thực hiện yêu cầu này, hãy bỏ qua email — không cần làm gì cả.</p>`,
  });

  return { subject, text, html };
}
