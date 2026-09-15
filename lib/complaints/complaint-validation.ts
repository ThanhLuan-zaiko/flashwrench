import type {
  ComplaintAction,
  ComplaintFieldErrors,
  ComplaintRefType,
  ComplaintStatus,
} from "./complaint.types";

export const COMPLAINT_STATUSES: ComplaintStatus[] = [
  "open",
  "in_review",
  "resolved",
  "rejected",
];

export const COMPLAINT_REF_TYPES: ComplaintRefType[] = [
  "booking",
  "emergency",
  "order",
  "account",
  "other",
];

const PHONE_PATTERN = /^[0-9+()\s.-]{8,20}$/;

function checkReporterName(name: string, errors: ComplaintFieldErrors): void {
  const trimmed = name.trim();
  if (!trimmed) {
    errors.reporterName = "Tên người phản ánh không được để trống.";
  } else if (trimmed.length > 80) {
    errors.reporterName = "Tên người phản ánh tối đa 80 ký tự.";
  }
}

export function validateComplaintInput(input: {
  reporterName: string;
  reporterPhone?: string;
  targetUserId?: string;
  targetName?: string;
  refType?: string;
  refId?: string;
  subject: string;
  body: string;
}): ComplaintFieldErrors | null {
  const errors: ComplaintFieldErrors = {};
  checkReporterName(input.reporterName, errors);
  const phone = (input.reporterPhone ?? "").trim();
  if (phone && !PHONE_PATTERN.test(phone)) {
    errors.reporterPhone = "Số điện thoại chưa đúng định dạng.";
  }
  if (input.targetUserId !== undefined && input.targetUserId.length > 80) {
    errors.targetUserId = "Mã người bị phản ánh tối đa 80 ký tự.";
  }
  if (input.targetName !== undefined && input.targetName.trim().length > 120) {
    errors.targetName = "Tên người bị phản ánh tối đa 120 ký tự.";
  }
  if (
    input.refType !== undefined &&
    !(COMPLAINT_REF_TYPES as string[]).includes(input.refType)
  ) {
    errors.refType = "Loại liên quan không hợp lệ.";
  }
  if (input.refId !== undefined && input.refId.trim().length > 80) {
    errors.refId = "Mã liên quan tối đa 80 ký tự.";
  }
  const subject = input.subject.trim();
  if (!subject) {
    errors.subject = "Tiêu đề không được để trống.";
  } else if (subject.length < 5 || subject.length > 120) {
    errors.subject = "Tiêu đề phải dài từ 5 đến 120 ký tự.";
  }
  const body = input.body.trim();
  if (!body) {
    errors.body = "Nội dung không được để trống.";
  } else if (body.length < 10 || body.length > 2000) {
    errors.body = "Nội dung phải dài từ 10 đến 2000 ký tự.";
  }
  return Object.keys(errors).length > 0 ? errors : null;
}

export function validateTransitionInput(input: {
  action: string;
  note?: string;
}): ComplaintFieldErrors | null {
  const errors: ComplaintFieldErrors = {};
  const actions: ComplaintAction[] = [
    "start-review",
    "resolve",
    "reject",
    "reopen",
  ];
  if (!(actions as string[]).includes(input.action)) {
    errors.form = "Hành động không hợp lệ.";
    return errors;
  }
  const needsNote = input.action === "resolve" || input.action === "reject";
  const note = (input.note ?? "").trim();
  if (needsNote && !note) {
    errors.note = "Vui lòng ghi lại cách xử lý trước khi kết thúc.";
  } else if (note && (note.length < 5 || note.length > 1000)) {
    errors.note = "Ghi chú xử lý phải dài từ 5 đến 1000 ký tự.";
  }
  return Object.keys(errors).length > 0 ? errors : null;
}
