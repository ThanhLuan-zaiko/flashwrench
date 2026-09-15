import type { PriceUnit } from "@/lib/catalog/service-catalog.types";

export const PRICE_UNIT_LABELS: Record<PriceUnit, string> = {
  per_job: "Trọn gói",
  per_hour: "Theo giờ",
  per_item: "Theo món",
};

export function formatVnd(value: number): string {
  return `${new Intl.NumberFormat("vi-VN").format(value)}đ`;
}

export function formatDuration(minutes: number): string {
  if (minutes >= 60 && minutes % 60 === 0) return `${minutes / 60} giờ`;
  return `${minutes} phút`;
}

export function excerpt(text: string, max = 80): string {
  const trimmed = text.trim();
  return trimmed.length > max ? `${trimmed.slice(0, max)}…` : trimmed;
}
