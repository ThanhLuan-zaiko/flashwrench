// Invoice PDF renderer. Server-side on purpose: the embedded font is the
// whole reason. jsPDF's standard PDF fonts are WinAnsi-only, so Vietnamese
// diacritics would come out as garbage without an embedded TrueType face;
// pulling ~246 KB of font into the browser to draw one document would be the
// worse trade.
//
// Pure: takes a GuestInvoice, returns bytes. No repository, no request, so
// bun:test can assert on the output without a database.
import { jsPDF } from "jspdf";
import {
  formatInvoiceDate,
  formatVnd,
  paymentMethodLabel,
  paymentStatusLabel,
  recordStatusLabel,
} from "@/lib/guest-access/guest-access.format";
import type { GuestInvoice } from "@/lib/guest-access/guest-access.types";
import {
  COLUMNS,
  CONTENT_WIDTH,
  drawField,
  drawRule,
  drawShadedRow,
  drawTotalLine,
  ensureSpace,
  INK,
  PAGE,
  placeText,
  setBold,
  setMuted,
} from "./invoice-pdf.draw";
import { registerPdfFonts } from "./pdf-fonts";

const KIND_TITLES: Record<GuestInvoice["kind"], string> = {
  booking: "Hóa đơn dịch vụ sửa xe",
  rescue: "Hóa đơn cứu hộ khẩn cấp",
  order: "Hóa đơn linh kiện",
};

const LINE_HEIGHT = 6;
/** The composer works in points for font size and millimetres for position. */
const TITLE_SIZE = 20;

function drawHeader(doc: jsPDF, invoice: GuestInvoice): number {
  doc.setTextColor(INK.strong);
  setBold(doc, true);
  doc.setFontSize(TITLE_SIZE);
  doc.text("HÓA ĐƠN", PAGE.margin, PAGE.margin + 6);

  setBold(doc, false);
  setMuted(doc, true);
  doc.setFontSize(10);
  doc.text(KIND_TITLES[invoice.kind], PAGE.margin, PAGE.margin + 13);
  setMuted(doc, false);

  // Reference and issue date sit on the right of the same band.
  setBold(doc, true);
  doc.setFontSize(10);
  doc.text(
    `Mã: ${invoice.reference}`,
    PAGE.margin + CONTENT_WIDTH,
    PAGE.margin + 5,
    {
      align: "right",
    },
  );
  setBold(doc, false);
  setMuted(doc, true);
  doc.setFontSize(9);
  doc.text(
    `Ngày: ${formatInvoiceDate(invoice.issuedAt)}`,
    PAGE.margin + CONTENT_WIDTH,
    PAGE.margin + 11,
    { align: "right" },
  );
  setMuted(doc, false);

  const ruleY = PAGE.margin + 19;
  drawRule(doc, ruleY);
  return ruleY;
}

/** Customer / vehicle / status grid, three columns across two rows. */
function drawSummary(doc: jsPDF, invoice: GuestInvoice): number {
  const fields: [string, string][] = [
    ["Khách hàng", invoice.customerName],
    ["Số điện thoại", invoice.customerPhone],
    ["Xe", invoice.vehicleLabel ?? "—"],
    ["Trạng thái", recordStatusLabel(invoice.status)],
    ["Thanh toán", paymentStatusLabel(invoice.paymentStatus)],
    ["Thợ phụ trách", invoice.mechanicName ?? "—"],
  ];

  let y = PAGE.margin + 30;
  for (let i = 0; i < fields.length; i += 3) {
    for (let c = 0; c < 3; c += 1) {
      const [label, value] = fields[i + c];
      const x = PAGE.margin + c * (CONTENT_WIDTH / 3);
      drawField(doc, label, value, x, y, CONTENT_WIDTH / 3 - 4);
    }
    y += 18;
  }
  return y;
}

function drawTableHeader(doc: jsPDF, y: number): number {
  drawShadedRow(doc, y - 4, 8);
  setBold(doc, true);
  doc.setFontSize(8.5);
  setMuted(doc, true);
  placeText(doc, COLUMNS.name, "HẠNG MỤC", y);
  placeText(doc, COLUMNS.qty, "SL", y);
  placeText(doc, COLUMNS.unit, "ĐƠN GIÁ", y);
  placeText(doc, COLUMNS.total, "THÀNH TIỀN", y);
  setMuted(doc, false);
  return y + 4;
}

function drawLineItems(
  doc: jsPDF,
  invoice: GuestInvoice,
  startY: number,
): number {
  let y = drawTableHeader(doc, startY);

  for (const line of invoice.lines) {
    // Wrap the name first, then reserve room for the whole block.
    const wrapped = doc.splitTextToSize(
      line.name,
      COLUMNS.name.width,
    ) as string[];
    const rowHeight = Math.max(LINE_HEIGHT, wrapped.length * 4.4 + 2);
    y = ensureSpace(doc, y, rowHeight + 4);
    if (y === PAGE.margin) y = drawTableHeader(doc, y);

    setBold(doc, false);
    doc.setTextColor(INK.body);
    doc.setFontSize(9.5);
    doc.text(wrapped, COLUMNS.name.x, y);
    placeText(doc, COLUMNS.qty, String(line.quantity), y);
    placeText(doc, COLUMNS.unit, formatVnd(line.unitPrice), y);
    setBold(doc, true);
    setMuted(doc, false);
    placeText(doc, COLUMNS.total, formatVnd(line.lineTotal), y);

    y += rowHeight;
  }
  return y;
}

function drawTotals(doc: jsPDF, invoice: GuestInvoice, startY: number): number {
  const { totals } = invoice;
  // Reserve the block so the totals never straddle a page break.
  let y = ensureSpace(doc, startY + 6, 42);

  drawRule(doc, y);
  y += 7;
  drawTotalLine(doc, "Tạm tính", formatVnd(totals.subtotal), y, false);
  if (totals.extraFee > 0) {
    y += 5.5;
    drawTotalLine(doc, "Phí phát sinh", formatVnd(totals.extraFee), y, false);
  }
  if (totals.discount > 0) {
    y += 5.5;
    drawTotalLine(doc, "Giảm giá", `−${formatVnd(totals.discount)}`, y, false);
  }
  y += 7;
  drawTotalLine(doc, "Tổng cộng", formatVnd(totals.total), y, true);
  y += 6;
  drawTotalLine(doc, "Đã thanh toán", formatVnd(totals.paid), y, false);
  if (totals.outstanding > 0) {
    y += 6;
    drawTotalLine(doc, "Còn phải trả", formatVnd(totals.outstanding), y, true);
  }
  return y;
}

function drawPayments(
  doc: jsPDF,
  invoice: GuestInvoice,
  startY: number,
): number {
  if (invoice.payments.length === 0) return startY;

  let y = ensureSpace(doc, startY + 12, 18);
  drawRule(doc, y);
  y += 8;
  setBold(doc, true);
  setMuted(doc, true);
  doc.setFontSize(8.5);
  doc.text("LỊCH SỬ THANH TOÁN", PAGE.margin, y);
  setMuted(doc, false);
  y += 6;

  const right = {
    x: PAGE.margin + CONTENT_WIDTH - 40,
    width: 40,
    align: "right" as const,
  };
  for (const payment of invoice.payments) {
    y = ensureSpace(doc, y, 6);
    setBold(doc, false);
    setMuted(doc, false);
    doc.setFontSize(9.5);
    const label = `${paymentMethodLabel(payment.method)}${
      payment.paidAt ? ` · ${formatInvoiceDate(payment.paidAt)}` : ""
    }`;
    doc.text(doc.splitTextToSize(label, CONTENT_WIDTH - 46), PAGE.margin, y);
    setBold(doc, true);
    setMuted(doc, false);
    placeText(doc, right, formatVnd(payment.amount), y);
    y += 5.5;
  }
  return y;
}

function drawFooter(doc: jsPDF, invoice: GuestInvoice, y: number): void {
  let cursor = y;
  if (invoice.notes) {
    cursor = ensureSpace(doc, y + 8, 14);
    drawRule(doc, cursor);
    cursor += 7;
    setBold(doc, false);
    setMuted(doc, true);
    doc.setFontSize(9);
    doc.text(
      doc.splitTextToSize(
        `Ghi chú: ${invoice.notes}`,
        CONTENT_WIDTH,
      ) as string[],
      PAGE.margin,
      cursor,
    );
    cursor += 8;
  }
  // Signature line on the right, mirroring a paper invoice.
  cursor = ensureSpace(doc, cursor, 24);
  setBold(doc, false);
  setMuted(doc, true);
  doc.setFontSize(9);
  doc.text("Người nhận", PAGE.margin + CONTENT_WIDTH - 50, cursor, {
    align: "center",
  });
  doc.setLineWidth(0.2);
  doc.setDrawColor(INK.rule);
  doc.line(
    PAGE.margin + CONTENT_WIDTH - 75,
    cursor + 10,
    PAGE.margin + CONTENT_WIDTH - 25,
    cursor + 10,
  );
  doc.setFontSize(7.5);
  doc.text(
    "Tài liệu được tạo tự động từ hệ thống FlashWrench.",
    PAGE.margin,
    PAGE.height - 10,
  );
}

export function invoiceFileName(invoice: GuestInvoice): string {
  const kind =
    invoice.kind === "order" ? "don-linh-kien" : `hoa-don-${invoice.kind}`;
  return `${kind}-${invoice.reference}.pdf`;
}

/** Renders the document and returns the raw PDF bytes. */
export async function renderInvoicePdf(invoice: GuestInvoice): Promise<Buffer> {
  const doc = new jsPDF({ unit: "mm", format: "a4", compress: true });
  await registerPdfFonts(doc);

  let y = drawHeader(doc, invoice);
  y = drawSummary(doc, invoice);
  y = drawLineItems(doc, invoice, y + 2);
  y = drawTotals(doc, invoice, y + 4);
  y = drawPayments(doc, invoice, y + 8);
  drawFooter(doc, invoice, y + 6);

  return Buffer.from(doc.output("arraybuffer") as ArrayBuffer);
}
