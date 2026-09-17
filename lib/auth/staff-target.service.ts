import { fail, type StaffResult, type TargetGate } from "./staff.types";
import { findUserById } from "./user.repository";

export async function loadManageableTarget(
  adminId: string,
  targetUserId: string,
): Promise<TargetGate> {
  const target = await findUserById(targetUserId);
  if (!target) {
    return { error: fail<StaffResult>(404, "Không tìm thấy người dùng.") };
  }
  if (target.user_id === adminId) {
    return {
      error: fail<StaffResult>(
        403,
        "Không thể thay đổi tài khoản của chính mình.",
      ),
    };
  }
  if (target.role === "admin") {
    return {
      error: fail<StaffResult>(
        403,
        "Không thể thay đổi tài khoản quản trị viên khác.",
      ),
    };
  }
  return { target };
}
