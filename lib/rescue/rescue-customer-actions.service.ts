// Customer self-cancel for their own rescue while no mechanic is on the
// road (open → dispatched → accepted). Once the mechanic departs the
// trip is real, so cancellation from en_route on stays a hotline/
// dispatcher decision — rescue is realtime and trips cost money.
// Guests keep the hotline: the public tracking id is a shareable
// capability, not proof of ownership.
import type { PublicUser } from "@/lib/auth/user.types";
import { publishRescueChange } from "@/lib/realtime/domain-publish";
import { isUuid } from "@/lib/validation";
import type { RescueActionResult } from "./rescue.types";
import { canCustomerCancelRescue, isRescueStatus } from "./rescue-status";
import {
  claimRescueTransition,
  findRescueRowById,
  projectRescueTransition,
  type RescueRow,
  type RescueTransitionWrite,
} from "./rescue-workflow.repository";

export type CustomerCancelRescueOutcome = {
  requestId: string;
  status: string;
};

const MAX_NOTE = 300;

function fail<T>(status: number, form: string): RescueActionResult<T> {
  return { ok: false, status, errors: { form } };
}

function cancelWrite(
  row: RescueRow,
  actorId: string,
  note: string,
): RescueTransitionWrite {
  return {
    before: row,
    status: "cancelled",
    mechanicId: null,
    mechanicName: null,
    etaMin: null,
    actorId,
    note,
    at: new Date(),
  };
}

export async function cancelCustomerRescue(
  actor: PublicUser,
  requestId: string,
  rawNote: unknown,
): Promise<RescueActionResult<CustomerCancelRescueOutcome>> {
  if (actor.role !== "customer") {
    return fail(403, "Bạn không có quyền thực hiện thao tác này.");
  }
  if (!isUuid(requestId)) {
    return fail(400, "Mã yêu cầu cứu hộ không hợp lệ.");
  }
  const note =
    typeof rawNote === "string" ? rawNote.trim().replace(/\s+/g, " ") : "";
  if (note.length === 0) {
    return {
      ok: false,
      status: 400,
      errors: { note: "Vui lòng nhập lý do hủy ca cứu hộ." },
    };
  }
  if (note.length > MAX_NOTE) {
    return {
      ok: false,
      status: 400,
      errors: { note: `Lý do hủy tối đa ${MAX_NOTE} ký tự.` },
    };
  }

  let row = await findRescueRowById(requestId);
  if (!row || row.customer_id !== actor.id) {
    return fail(404, "Không tìm thấy yêu cầu cứu hộ này.");
  }

  // The 30s offer cycle keeps flipping this row (expire → re-offer,
  // mechanic accept/depart), so a lost CAS claim gets one bounded retry
  // against the freshly-read state instead of bouncing to the customer.
  let write: RescueTransitionWrite | null = null;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const current = isRescueStatus(row.status) ? row.status : null;
    if (!current || !canCustomerCancelRescue(current)) {
      return fail(
        400,
        current === "en_route" || current === "arrived"
          ? "Thợ đã xuất phát — vui lòng gọi hotline để hủy ca cứu hộ."
          : "Ca cứu hộ này không còn ở trạng thái có thể hủy.",
      );
    }
    const candidate = cancelWrite(row, actor.id, note);
    if (await claimRescueTransition(candidate)) {
      write = candidate;
      break;
    }
    if (attempt === 0) {
      const fresh = await findRescueRowById(requestId);
      if (!fresh || fresh.customer_id !== actor.id) {
        return fail(404, "Không tìm thấy yêu cầu cứu hộ này.");
      }
      row = fresh;
    }
  }
  if (!write) {
    return fail(
      409,
      "Yêu cầu vừa được cập nhật. Vui lòng tải lại trước khi thao tác.",
    );
  }

  await projectRescueTransition(write);
  await publishRescueChange(
    "rescue-updated",
    requestId,
    "cancelled",
    write.before.customer_id,
    write.before.assigned_mechanic_id
      ? [write.before.assigned_mechanic_id]
      : [],
    write.before.zone_id,
  );
  return { ok: true, data: { requestId, status: "cancelled" } };
}
