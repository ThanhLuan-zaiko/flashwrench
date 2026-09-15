import { hashPassword } from "./password";
import { fail, type StaffCreateResult, toStaffItem } from "./staff.types";
import { generateTempPassword } from "./staff.validation";
import { persistTempPassword } from "./staff-pending.service";
import {
  bumpTokenVersion,
  findUserById,
  updatePassword,
} from "./user.repository";
import type { UserStatus } from "./user.types";

// Issue a fresh temp password for one staff account and keep it visible
// until changed. Covers accounts created before persistent passwords
// existed and recoveries after a misconfigured STAFF_TEMP_SECRET: the new
// password is encrypted, stored, returned, and broadcast like a creation.
// Old sessions die with the password rotation via the token bump.
export async function resetStaffTempPassword(
  adminId: string,
  targetUserId: string,
): Promise<StaffCreateResult> {
  const target = await findUserById(targetUserId);
  if (!target) return fail(404, "Không tìm thấy người dùng.");
  if (target.user_id === adminId) {
    return fail(403, "Không thể thay đổi tài khoản của chính mình.");
  }
  if (target.role === "admin") {
    return fail(403, "Không thể thay đổi tài khoản quản trị viên khác.");
  }
  if ((target.status as UserStatus) === "deleted") {
    return fail(
      400,
      "Tài khoản đang nằm trong thùng rác. Hãy khôi phục trước.",
    );
  }

  const tempPassword = generateTempPassword();
  await updatePassword(target.user_id, await hashPassword(tempPassword));
  await bumpTokenVersion(target.user_id).catch(() => undefined);
  await persistTempPassword(target.user_id, tempPassword, adminId);

  const updated = await findUserById(target.user_id);
  if (!updated) return fail(404, "Không tìm thấy người dùng.");
  return { ok: true, user: toStaffItem(updated), tempPassword };
}
