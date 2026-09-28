// CSV export for revenue reports. Pure builder — the route decides the
// filename and content type. BOM included so Excel opens UTF-8 VND and
// Vietnamese labels without mangling.
import type { RevenueReport, RevenueTransaction } from "./revenue.types";

const SOURCE_LABELS: Record<string, string> = {
  booking: "Đơn sửa xe",
  order: "Đơn linh kiện",
  emergency: "Cứu hộ",
};

const METHOD_LABELS: Record<string, string> = {
  cod: "Tiền mặt",
  counter: "Tại quầy",
  bank_transfer: "Chuyển khoản",
  momo: "MoMo",
  vnpay: "VNPay",
  zalopay: "ZaloPay",
  card: "Thẻ",
};

function cell(value: string | number | boolean | null | undefined): string {
  if (value === null || value === undefined) return "";
  const text = String(value);
  if (/[",\n\r]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

function row(values: (string | number | boolean | null | undefined)[]): string {
  return values.map(cell).join(",");
}

export function sourceLabel(source: string | null): string {
  return SOURCE_LABELS[source ?? ""] ?? source ?? "";
}

export function methodLabel(method: string | null): string {
  return METHOD_LABELS[method ?? ""] ?? method ?? "";
}

function transactionLine(t: RevenueTransaction, includeStaff: boolean): string {
  const base = [
    t.paidAt ?? "",
    t.paymentId,
    sourceLabel(t.refType),
    t.refId,
    t.amount,
    methodLabel(t.method),
    t.status ?? "",
  ];
  if (!includeStaff) return row(base);
  return row([
    ...base,
    t.mechanicId ?? "",
    t.recordedBy ?? "",
    t.customerConfirmed === null
      ? ""
      : t.customerConfirmed
        ? "Đã xác nhận"
        : "Chưa xác nhận",
  ]);
}

// includeStaff adds accountability columns (collector, recorder, customer
// confirmation) — admin exports only; dispatcher files stay aggregate-safe.
export function buildRevenueCsv(
  report: RevenueReport,
  includeStaff = false,
): string {
  const header = [
    "Thời gian thu",
    "Mã giao dịch",
    "Nguồn",
    "Mã tham chiếu",
    "Số tiền (VND)",
    "Phương thức",
    "Trạng thái",
  ];
  if (includeStaff) {
    header.push("Thợ phụ trách", "Người ghi nhận", "Khách xác nhận");
  }
  const lines: string[] = [
    row(["Báo cáo doanh thu", report.label]),
    row(["Múi giờ", report.timeZone]),
    row([
      "Tổng thu (VND)",
      report.collected,
      "Số giao dịch",
      report.receipts,
      "Trung bình/giao dịch",
      report.avgReceipt,
    ]),
    row([
      "Kỳ trước (VND)",
      report.previous.collected,
      "Chênh lệch",
      report.previous.delta,
      "Tăng trưởng %",
      report.previous.percent ?? "",
    ]),
    "",
    row(header),
    ...report.transactions.map((t) => transactionLine(t, includeStaff)),
  ];
  if (report.truncated) {
    lines.push(row(["(Danh sách bị cắt bớt do vượt giới hạn xuất)"]));
  }
  return `﻿${lines.join("\r\n")}`;
}

export function revenueCsvFilename(report: RevenueReport): string {
  return `doanh-thu-${report.range}-${report.anchor}.csv`;
}
