// Input validation for auto-grant rules. Mirrors voucher-validation.ts:
// collect every field error, return null when clean.
import { isUuid, numericInput } from "@/lib/validation";
import type { AutoRuleFieldErrors, AutoTrigger } from "./auto-rule.types";
import { AUTO_TRIGGERS } from "./auto-rule.types";

const MAX_NAME_LENGTH = 120;
const MIN_MONEY_THRESHOLD = 1000;
const MAX_THRESHOLD = 1_000_000_000_000;
const MAX_WINDOW_DAYS = 3650;

// Which numeric input each trigger actually needs. signup/review_created
// take no number at all; win_back is driven by window_days instead.
const COUNT_TRIGGERS: readonly AutoTrigger[] = ["booking_count", "order_count"];
const MONEY_TRIGGERS: readonly AutoTrigger[] = ["order_value", "spend_total"];

export function validateAutoRuleInput(input: {
  name: string;
  campaignId: string;
  triggerType: unknown;
  threshold?: unknown;
  windowDays?: unknown;
}): AutoRuleFieldErrors | null {
  const errors: AutoRuleFieldErrors = {};

  const name = input.name.trim();
  if (name.length === 0) {
    errors.name = "Nhập tên quy tắc.";
  } else if (name.length > MAX_NAME_LENGTH) {
    errors.name = `Tên quy tắc tối đa ${MAX_NAME_LENGTH} ký tự.`;
  }

  if (!isUuid(input.campaignId.trim())) {
    errors.campaignId = "Chọn chiến dịch hợp lệ.";
  }

  const triggerType = input.triggerType as AutoTrigger;
  if (!AUTO_TRIGGERS.includes(triggerType)) {
    errors.triggerType = "Chọn sự kiện kích hoạt hợp lệ.";
  }

  if (
    COUNT_TRIGGERS.includes(triggerType) ||
    MONEY_TRIGGERS.includes(triggerType)
  ) {
    const threshold = numericInput(input.threshold);
    if (!Number.isInteger(threshold) || threshold <= 0) {
      errors.threshold = "Nhập mốc hợp lệ (số nguyên dương).";
    } else if (
      MONEY_TRIGGERS.includes(triggerType) &&
      threshold < MIN_MONEY_THRESHOLD
    ) {
      errors.threshold = `Mốc tiền tối thiểu ${MIN_MONEY_THRESHOLD.toLocaleString("vi-VN")}đ.`;
    } else if (threshold > MAX_THRESHOLD) {
      errors.threshold = "Mốc quá lớn.";
    }
  }

  if (triggerType === "win_back") {
    const windowDays = numericInput(input.windowDays);
    if (!Number.isInteger(windowDays) || windowDays <= 0) {
      errors.windowDays = "Nhập số ngày vắng hợp lệ.";
    } else if (windowDays > MAX_WINDOW_DAYS) {
      errors.windowDays = `Số ngày tối đa ${MAX_WINDOW_DAYS}.`;
    }
  }

  return Object.keys(errors).length > 0 ? errors : null;
}
