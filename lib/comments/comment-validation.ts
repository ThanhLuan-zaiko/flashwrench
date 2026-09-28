import { isUuid } from "@/lib/validation";
import type { CommentFieldErrors, CommentTargetType } from "./comment.types";

export const MAX_COMMENT_BODY = 1000;

export const COMMENT_TARGET_TYPES: CommentTargetType[] = [
  "booking",
  "order",
  "rescue",
  "complaint",
  "part",
];

export function isCommentTargetType(
  value: unknown,
): value is CommentTargetType {
  return (
    typeof value === "string" &&
    (COMMENT_TARGET_TYPES as string[]).includes(value)
  );
}

export function validateCommentTarget(
  targetType: unknown,
  targetId: unknown,
): { errors: CommentFieldErrors } | null {
  const errors: CommentFieldErrors = {};
  if (!isCommentTargetType(targetType)) {
    errors.targetType = "Khu vực bình luận không hợp lệ.";
  }
  if (!isUuid(targetId)) {
    errors.targetId = "Mã mục bình luận không hợp lệ.";
  }
  return Object.keys(errors).length > 0 ? { errors } : null;
}

export function validateCommentBody(raw: unknown): {
  body: string;
  errors: CommentFieldErrors | null;
} {
  const errors: CommentFieldErrors = {};
  const body = typeof raw === "string" ? raw.trim() : "";
  if (!body) {
    errors.body = "Nội dung bình luận không được để trống.";
  } else if (body.length > MAX_COMMENT_BODY) {
    errors.body = `Bình luận tối đa ${MAX_COMMENT_BODY} ký tự.`;
  }
  return { body, errors: Object.keys(errors).length > 0 ? errors : null };
}
