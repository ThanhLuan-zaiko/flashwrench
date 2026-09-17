import { randomInt } from "node:crypto";
import type { UserRole } from "./user.types";
import {
  normalizeEmail,
  normalizePhone,
  validateEmail,
  validateFullName,
  validatePhone,
} from "./validation";

// Roles an admin may assign when creating staff. Customers self-register,
// so creation is limited to mechanic/dispatcher. Admins are never created
// through this flow.
export const STAFF_CREATABLE_ROLES: UserRole[] = ["mechanic", "dispatcher"];

// Roles allowed when editing: existing customers stay manageable, but no
// one can ever be edited into an admin.
export const STAFF_EDITABLE_ROLES: UserRole[] = [
  "customer",
  "mechanic",
  "dispatcher",
];

export type StaffCreateInput = {
  fullName: string;
  phone: string;
  email: string;
  role: UserRole;
  avatarAssetId?: string | null;
};

export type StaffUpdateInput = {
  fullName: string;
  phone: string;
  email: string;
  role: UserRole;
  avatarAssetId?: string | null;
};

export type StaffFieldErrors = Partial<
  Record<
    | "fullName"
    | "phone"
    | "email"
    | "role"
    | "avatarAssetId"
    | "confirm"
    | "form",
    string
  >
>;

export function validateStaffAvatarId(value: unknown): string | null {
  if (value === undefined || value === null) return null;
  if (
    typeof value !== "string" ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      value.trim(),
    )
  ) {
    return "Mã ảnh đại diện không hợp lệ.";
  }
  return null;
}

function validateRole(role: unknown, allowed: UserRole[]): string | null {
  if (!allowed.includes(role as UserRole)) {
    return allowed.includes("customer")
      ? "Vai trò không hợp lệ. Chỉ được chọn khách hàng, thợ hoặc điều phối."
      : "Vai trò không hợp lệ. Chỉ được chọn thợ hoặc điều phối.";
  }
  return null;
}

function collectCommon(
  input: StaffCreateInput,
  allowed: UserRole[],
): StaffFieldErrors {
  const errors: StaffFieldErrors = {};
  const fullNameError = validateFullName(input.fullName ?? "");
  if (fullNameError) errors.fullName = fullNameError;
  const phoneError = validatePhone(input.phone ?? "");
  if (phoneError) errors.phone = phoneError;
  const emailError = validateEmail(input.email ?? "");
  if (emailError) errors.email = emailError;
  const roleError = validateRole(input.role, allowed);
  if (roleError) errors.role = roleError;
  const avatarError = validateStaffAvatarId(input.avatarAssetId);
  if (avatarError) errors.avatarAssetId = avatarError;
  return errors;
}

export function validateStaffCreate(
  input: StaffCreateInput,
): StaffFieldErrors | null {
  const errors = collectCommon(input, STAFF_CREATABLE_ROLES);
  return Object.keys(errors).length > 0 ? errors : null;
}

export function validateStaffUpdate(
  input: StaffUpdateInput,
): StaffFieldErrors | null {
  const errors = collectCommon(input, STAFF_EDITABLE_ROLES);
  return Object.keys(errors).length > 0 ? errors : null;
}

export function normalizeStaffContacts(input: {
  phone: string;
  email: string;
}): { phone: string; email: string } {
  return {
    phone: normalizePhone(input.phone),
    email: normalizeEmail(input.email),
  };
}

const TEMP_ALPHABET =
  "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";

// One-time password shown to the admin after creating staff. Letters and
// digits only (no ambiguous 0/O/1/l), always contains both classes so it
// passes validatePassword. Staff must change it after first login.
export function generateTempPassword(length = 12): string {
  for (;;) {
    let out = "";
    for (let i = 0; i < length; i += 1) {
      out += TEMP_ALPHABET[randomInt(TEMP_ALPHABET.length)];
    }
    if (/[A-Za-z]/.test(out) && /\d/.test(out)) return out;
  }
}
