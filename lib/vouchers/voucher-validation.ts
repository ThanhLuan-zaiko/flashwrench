// Pure validation for voucher campaigns and wallet grants. No DB here.
import type {
  VoucherDiscountType,
  VoucherFieldErrors,
  VoucherScope,
} from "./voucher.types";

const CODE_PATTERN = /^[A-Z0-9_-]{3,32}$/;

export function normalizeVoucherCode(raw: unknown): string {
  return String(raw ?? "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "_");
}

export function isDiscountType(value: unknown): value is VoucherDiscountType {
  return value === "percent" || value === "fixed" || value === "free_service";
}

export function isVoucherScope(value: unknown): value is VoucherScope {
  return value === "order" || value === "booking" || value === "all";
}

export function isMediaVoucherUrl(value: string): boolean {
  return value.startsWith("/api/media/promotion/");
}

export function validateCampaignInput(input: {
  code: string;
  name: string;
  description: string;
  imageUrl: string;
  discountType: unknown;
  discountValue: unknown;
  maxDiscount: unknown;
  minOrder: unknown;
  scope: unknown;
  startAt: unknown;
  endAt: unknown;
  totalLimit: unknown;
  perUserLimit: unknown;
  allowDispatcherGrant: unknown;
  dispatcherMaxValue: unknown;
  isActive: unknown;
}): VoucherFieldErrors | null {
  const errors: VoucherFieldErrors = {};
  if (!CODE_PATTERN.test(input.code)) {
    errors.code = "Mã gồm 3-32 ký tự hoa, số, gạch dưới hoặc gạch ngang.";
  }
  if (input.name.length < 3 || input.name.length > 120) {
    errors.name = "Tên chương trình từ 3 đến 120 ký tự.";
  }
  if (input.description.length > 500) {
    errors.description = "Mô tả tối đa 500 ký tự.";
  }
  if (input.imageUrl && !isMediaVoucherUrl(input.imageUrl)) {
    errors.imageUrl = "Ảnh bìa phải tải lên từ kho ảnh khuyến mãi.";
  }
  if (!isDiscountType(input.discountType)) {
    errors.discountType = "Loại giảm giá không hợp lệ.";
  }
  const value = Number(input.discountValue);
  if (!Number.isInteger(value) || value <= 0) {
    errors.discountValue = "Giá trị giảm phải là số nguyên dương.";
  } else if (input.discountType === "percent" && value > 100) {
    errors.discountValue = "Giảm theo phần trăm tối đa 100%.";
  }
  const maxDiscount = Number(input.maxDiscount ?? 0);
  if (!Number.isInteger(maxDiscount) || maxDiscount < 0) {
    errors.maxDiscount = "Mức giảm tối đa không hợp lệ.";
  }
  const minOrder = Number(input.minOrder ?? 0);
  if (!Number.isInteger(minOrder) || minOrder < 0) {
    errors.minOrder = "Giá trị đơn tối thiểu không hợp lệ.";
  }
  if (!isVoucherScope(input.scope)) {
    errors.scope = "Phạm vi áp dụng không hợp lệ.";
  }
  const start = parseDateInput(input.startAt);
  const end = parseDateInput(input.endAt);
  if (input.startAt !== undefined && input.startAt !== "" && !start) {
    errors.startAt = "Ngày bắt đầu không hợp lệ.";
  }
  if (input.endAt !== undefined && input.endAt !== "" && !end) {
    errors.endAt = "Ngày kết thúc không hợp lệ.";
  }
  if (start && end && end <= start) {
    errors.endAt = "Ngày kết thúc phải sau ngày bắt đầu.";
  }
  const totalLimit = Number(input.totalLimit ?? 0);
  if (!Number.isInteger(totalLimit) || totalLimit < 0 || totalLimit > 100000) {
    errors.totalLimit = "Giới hạn phát hành từ 0 đến 100000.";
  }
  const perUser = Number(input.perUserLimit ?? 1);
  if (!Number.isInteger(perUser) || perUser < 1 || perUser > 10) {
    errors.perUserLimit = "Mỗi khách nhận tối đa 1-10 voucher.";
  }
  if (typeof input.allowDispatcherGrant !== "boolean") {
    errors.allowDispatcherGrant = "Cờ điều phối không hợp lệ.";
  }
  const cap = Number(input.dispatcherMaxValue ?? 0);
  if (!Number.isInteger(cap) || cap < 0) {
    errors.dispatcherMaxValue = "Hạn mức điều phối không hợp lệ.";
  }
  if (input.isActive !== undefined && typeof input.isActive !== "boolean") {
    errors.isActive = "Trạng thái không hợp lệ.";
  }
  return Object.keys(errors).length > 0 ? errors : null;
}

export function validateGrantInput(input: {
  campaignId: string;
  userId: string;
  note: string;
  expiresAt: unknown;
}): VoucherFieldErrors | null {
  const errors: VoucherFieldErrors = {};
  if (!input.campaignId) errors.campaignId = "Thiếu chương trình.";
  if (!input.userId) errors.userId = "Thiếu khách hàng nhận voucher.";
  if (input.note.length > 300) errors.note = "Ghi chú tối đa 300 ký tự.";
  if (
    input.expiresAt !== undefined &&
    input.expiresAt !== "" &&
    !parseDateInput(input.expiresAt)
  ) {
    errors.form = "Hạn dùng voucher không hợp lệ.";
  }
  return Object.keys(errors).length > 0 ? errors : null;
}

function parseDateInput(value: unknown): Date | null {
  if (value === undefined || value === null || value === "") return null;
  if (value instanceof Date)
    return Number.isNaN(value.getTime()) ? null : value;
  if (typeof value !== "string") return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function parseOptionalDate(value: unknown): Date | null {
  return parseDateInput(value);
}
