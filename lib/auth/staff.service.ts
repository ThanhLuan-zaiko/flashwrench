import { randomUUID } from "node:crypto";
import { setIdStatus, setRoleStatus } from "./admin-users.repository";
import { hashPassword } from "./password";
import { deleteSession, listSessionsByUser } from "./refresh.repository";
import {
  deleteEmailRow,
  deleteIdRow,
  deletePhoneRow,
  deleteRoleRow,
  insertRoleRow,
  setIdContacts,
  setIdProfile,
  setIdRole,
  setRoleProfile,
} from "./staff.repository";
import {
  fail,
  failFields,
  type StaffCreateResult,
  type StaffResult,
  type TargetGate,
  toStaffItem,
} from "./staff.types";
import {
  generateTempPassword,
  normalizeStaffContacts,
  type StaffCreateInput,
  type StaffUpdateInput,
  validateStaffCreate,
  validateStaffUpdate,
} from "./staff.validation";
import {
  clearTempPassword,
  persistTempPassword,
} from "./staff-pending.service";
import {
  claimEmail,
  claimPhone,
  createUserWithRole,
  findUserById,
  findUserIdByEmail,
  findUserIdByPhone,
  releaseEmail,
  releasePhone,
} from "./user.repository";
import { monthBucket, type UserRole, type UserStatus } from "./user.types";

// Guards shared by every staff mutation: admins can never touch their own
// account or any other admin account.
async function loadManageableTarget(
  adminId: string,
  targetUserId: string,
): Promise<TargetGate> {
  const target = await findUserById(targetUserId);
  if (!target)
    return {
      error: fail<StaffResult>(404, "Không tìm thấy người dùng."),
    } as const;
  if (target.user_id === adminId) {
    return {
      error: fail<StaffResult>(
        403,
        "Không thể thay đổi tài khoản của chính mình.",
      ),
    } as const;
  }
  if (target.role === "admin") {
    return {
      error: fail<StaffResult>(
        403,
        "Không thể thay đổi tài khoản quản trị viên khác.",
      ),
    } as const;
  }
  return { target } as const;
}

function cleanName(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

// Create one staff account with a temp password. The password is returned
// in the response and kept (encrypted) until the staff member changes it,
// so admins can still copy it after closing the dialog.
export async function createStaff(
  adminId: string,
  raw: StaffCreateInput,
): Promise<StaffCreateResult> {
  const invalid = validateStaffCreate(raw);
  if (invalid) return failFields(400, invalid);
  const fullName = cleanName(raw.fullName);
  const { phone, email } = normalizeStaffContacts(raw);

  const [phoneOwner, emailOwner] = await Promise.all([
    findUserIdByPhone(phone),
    findUserIdByEmail(email),
  ]);
  if (phoneOwner || emailOwner) {
    return failFields(409, {
      ...(phoneOwner ? { phone: "Số điện thoại này đã được đăng ký." } : {}),
      ...(emailOwner ? { email: "Email này đã được đăng ký." } : {}),
      form: "Thông tin này đã tồn tại. Vui lòng kiểm tra lại.",
    });
  }

  const tempPassword = generateTempPassword();
  const userId = randomUUID();
  const created = await createUserWithRole({
    userId,
    phone,
    email,
    passwordHash: await hashPassword(tempPassword),
    fullName,
    role: raw.role,
  });
  if (!created.ok) {
    const field =
      created.conflict === "phone"
        ? { phone: "Số điện thoại này đã được đăng ký." }
        : { email: "Email này đã được đăng ký." };
    return failFields(409, {
      ...field,
      form: "Thông tin này đã tồn tại. Vui lòng kiểm tra lại.",
    });
  }

  const row = await findUserById(userId);
  if (!row) return fail(404, "Không tìm thấy người dùng vừa tạo.");
  await persistTempPassword(userId, tempPassword, adminId);
  return { ok: true, user: toStaffItem(row), tempPassword };
}

// Full profile edit: name, contacts and role. Contact changes claim the new
// lookup rows first (LWT) and release the old ones only after success.
export async function updateStaff(
  adminId: string,
  targetUserId: string,
  raw: StaffUpdateInput,
): Promise<StaffResult> {
  const gate = await loadManageableTarget(adminId, targetUserId);
  if ("error" in gate) return gate.error;
  const target = gate.target;
  if ((target.status as UserStatus) === "deleted") {
    return fail(
      400,
      "Tài khoản đang nằm trong thùng rác. Hãy khôi phục trước.",
    );
  }
  const invalid = validateStaffUpdate(raw);
  if (invalid) return failFields(400, invalid);

  const fullName = cleanName(raw.fullName);
  const { phone, email } = normalizeStaffContacts(raw);
  const nextRole = raw.role;
  const prevRole = (target.role as UserRole) ?? "customer";
  const createdAt = target.created_at
    ? new Date(target.created_at)
    : new Date();
  const bucket = monthBucket(createdAt);
  const status = (target.status as UserStatus) ?? "active";

  if (phone !== (target.phone ?? "")) {
    const owner = await findUserIdByPhone(phone);
    if (owner && owner !== target.user_id) {
      return failFields(409, {
        phone: "Số điện thoại này đã được đăng ký.",
        form: "Thông tin này đã tồn tại. Vui lòng kiểm tra lại.",
      });
    }
    if (!(await claimPhone(phone, target.user_id))) {
      return failFields(409, {
        phone: "Số điện thoại này đã được đăng ký.",
        form: "Thông tin này đã tồn tại. Vui lòng kiểm tra lại.",
      });
    }
  }
  if (email !== (target.email ?? "")) {
    const owner = await findUserIdByEmail(email);
    if (owner && owner !== target.user_id) {
      if (phone !== (target.phone ?? "")) await releasePhone(phone);
      return failFields(409, {
        email: "Email này đã được đăng ký.",
        form: "Thông tin này đã tồn tại. Vui lòng kiểm tra lại.",
      });
    }
    if (!(await claimEmail(email, target.user_id))) {
      if (phone !== (target.phone ?? "")) await releasePhone(phone);
      return failFields(409, {
        email: "Email này đã được đăng ký.",
        form: "Thông tin này đã tồn tại. Vui lòng kiểm tra lại.",
      });
    }
  }

  const now = new Date();
  const phoneChanged = phone !== (target.phone ?? "");
  const emailChanged = email !== (target.email ?? "");
  try {
    await setIdProfile(target.user_id, fullName, now);
    if (phoneChanged || emailChanged) {
      await setIdContacts(target.user_id, phone, email, now);
    }
    if (nextRole !== prevRole) {
      await deleteRoleRow(prevRole, bucket, createdAt, target.user_id);
      await insertRoleRow({
        role: nextRole,
        monthBucket: bucket,
        createdAt,
        userId: target.user_id,
        fullName,
        phone,
        email,
        status,
      });
    } else {
      await setRoleProfile({
        role: prevRole,
        monthBucket: bucket,
        createdAt,
        userId: target.user_id,
        fullName,
        phone,
        email,
      });
    }
    if (nextRole !== prevRole) {
      await setIdRole(target.user_id, nextRole, now);
    }
  } catch (error) {
    if (phoneChanged) await releasePhone(phone).catch(() => undefined);
    if (emailChanged) await releaseEmail(email).catch(() => undefined);
    throw error;
  }
  if (phoneChanged && target.phone) {
    await releasePhone(target.phone).catch(() => undefined);
  }
  if (emailChanged && target.email) {
    await releaseEmail(target.email).catch(() => undefined);
  }

  const updated = await findUserById(target.user_id);
  if (!updated) return fail(404, "Không tìm thấy người dùng.");
  return { ok: true, user: toStaffItem(updated) };
}

// Soft delete moves the account to the trash (status deleted) and bumps
// token_version to kill live sessions. Only non-deleted accounts qualify.
export async function softDeleteStaff(
  adminId: string,
  targetUserId: string,
): Promise<StaffResult> {
  const gate = await loadManageableTarget(adminId, targetUserId);
  if ("error" in gate) return gate.error;
  const target = gate.target;
  if ((target.status as UserStatus) === "deleted") {
    return fail(400, "Tài khoản đã nằm trong thùng rác.");
  }
  const now = new Date();
  const createdAt = target.created_at ? new Date(target.created_at) : now;
  const role = (target.role as UserRole) ?? "customer";
  const nextToken = (target.token_version ?? 0) + 1;
  await setIdStatus(target.user_id, "deleted", nextToken, now);
  await setRoleStatus(
    role,
    monthBucket(createdAt),
    createdAt,
    target.user_id,
    "deleted",
  );
  const updated = await findUserById(target.user_id);
  if (!updated) return fail(404, "Không tìm thấy người dùng.");
  return { ok: true, user: toStaffItem(updated) };
}

// Restore a soft-deleted account back to active.
export async function restoreStaff(
  adminId: string,
  targetUserId: string,
): Promise<StaffResult> {
  const gate = await loadManageableTarget(adminId, targetUserId);
  if ("error" in gate) return gate.error;
  const target = gate.target;
  if ((target.status as UserStatus) !== "deleted") {
    return fail(400, "Chỉ khôi phục được tài khoản trong thùng rác.");
  }
  const now = new Date();
  const createdAt = target.created_at ? new Date(target.created_at) : now;
  const role = (target.role as UserRole) ?? "customer";
  await setIdStatus(target.user_id, "active", null, now);
  await setRoleStatus(
    role,
    monthBucket(createdAt),
    createdAt,
    target.user_id,
    "active",
  );
  const updated = await findUserById(target.user_id);
  if (!updated) return fail(404, "Không tìm thấy người dùng.");
  return { ok: true, user: toStaffItem(updated) };
}

// Hard delete permanently removes a trashed account. The caller must pass
// the account phone number as confirmation (mirrors the slug-typing guard
// for catalog hard deletes). Sessions are revoked on a best-effort basis.
export async function hardDeleteStaff(
  adminId: string,
  targetUserId: string,
  confirm: string,
): Promise<StaffResult> {
  const gate = await loadManageableTarget(adminId, targetUserId);
  if ("error" in gate) return gate.error;
  const target = gate.target;
  if ((target.status as UserStatus) !== "deleted") {
    return fail(400, "Chỉ xóa vĩnh viễn được tài khoản trong thùng rác.");
  }
  if ((confirm ?? "").trim() !== (target.phone ?? "")) {
    return failFields(400, {
      confirm: "Mã xác nhận không khớp với số điện thoại của tài khoản.",
    });
  }
  const createdAt = target.created_at
    ? new Date(target.created_at)
    : new Date();
  const role = (target.role as UserRole) ?? "customer";
  await listSessionsByUser(target.user_id)
    .then((sessions) =>
      Promise.all(
        sessions.map((s) =>
          deleteSession(target.user_id, s.family_id, s.created_at).catch(
            () => undefined,
          ),
        ),
      ),
    )
    .catch(() => undefined);
  await deleteRoleRow(role, monthBucket(createdAt), createdAt, target.user_id);
  if (target.phone) await deletePhoneRow(target.phone).catch(() => undefined);
  if (target.email) await deleteEmailRow(target.email).catch(() => undefined);
  await deleteIdRow(target.user_id);
  await clearTempPassword(target.user_id);
  return {
    ok: true,
    user: { ...toStaffItem(target), status: "deleted" as UserStatus },
  };
}
