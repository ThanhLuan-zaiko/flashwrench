// Mechanic actions on a dispatched rescue: accept the 30s offer or
// decline it so the system re-offers the next nearest mechanic.
// Dispatchers monitor the same rows in parallel via realtime.

import { publishRescueChange } from "@/lib/realtime/domain-publish";
import { isUuid } from "@/lib/validation";
import type { RescueResult } from "./rescue.types";
import { redispatchAfterDecline } from "./rescue-dispatch.service";
import {
  canApplyRescueAction,
  isRescueMechanicAction,
  isRescueStatus,
  type RescueMechanicAction,
} from "./rescue-status";
import {
  claimRescueTransition,
  findRescueRowById,
  projectRescueTransition,
} from "./rescue-workflow.repository";

export type RescueMechanicOutcome = {
  requestId: string;
  status: string;
  assignedMechanicId: string | null;
  assignedMechanicName: string | null;
};

function fail<T>(status: number, form: string): RescueResult<T> {
  return { ok: false, status, errors: { form } };
}

export async function applyRescueMechanicAction(
  mechanicId: string,
  requestId: string,
  rawAction: unknown,
): Promise<RescueResult<RescueMechanicOutcome>> {
  if (!isUuid(requestId)) return fail(400, "Mã yêu cầu cứu hộ không hợp lệ.");
  if (!isRescueMechanicAction(rawAction)) {
    return {
      ok: false,
      status: 400,
      errors: { form: "Thao tác không hợp lệ." },
    };
  }
  const action: RescueMechanicAction = rawAction;
  // Expire is system-driven; mechanics only accept or decline.
  if (action === "expire") {
    return {
      ok: false,
      status: 400,
      errors: { form: "Thao tác không hợp lệ." },
    };
  }

  const row = await findRescueRowById(requestId);
  if (!row) return fail(404, "Không tìm thấy yêu cầu cứu hộ này.");
  if (row.assigned_mechanic_id !== mechanicId) {
    return fail(403, "Yêu cầu này không thuộc về bạn.");
  }
  const current = isRescueStatus(row.status) ? row.status : null;
  if (!current || !canApplyRescueAction(action, current)) {
    return fail(400, "Yêu cầu ở trạng thái này không thể thao tác.");
  }

  const nextStatus = action === "accept" ? "accepted" : "open";
  const at = new Date();
  const applied = await claimRescueTransition({
    before: row,
    status: nextStatus,
    mechanicId: action === "accept" ? mechanicId : null,
    mechanicName: action === "accept" ? row.assigned_mechanic_name : null,
    actorId: mechanicId,
    note: action === "accept" ? "Thợ nhận cứu hộ." : "Thợ từ chối cứu hộ.",
    at,
  });
  if (!applied) {
    return fail(409, "Yêu cầu vừa được cập nhật. Vui lòng tải lại.");
  }
  await projectRescueTransition({
    before: row,
    status: nextStatus,
    mechanicId: action === "accept" ? mechanicId : null,
    mechanicName: action === "accept" ? row.assigned_mechanic_name : null,
    actorId: mechanicId,
    note: action === "accept" ? "Thợ nhận cứu hộ." : "Thợ từ chối cứu hộ.",
    at,
  });
  await publishRescueChange(
    action === "accept" ? "rescue-assigned" : "rescue-updated",
    requestId,
    nextStatus,
    row.customer_id,
    [mechanicId],
    row.zone_id,
  );

  if (action === "decline") {
    await redispatchAfterDecline(requestId, mechanicId);
  }

  return {
    ok: true,
    data: {
      requestId,
      status: nextStatus,
      assignedMechanicId: action === "accept" ? mechanicId : null,
      assignedMechanicName:
        action === "accept" ? row.assigned_mechanic_name : null,
    },
  };
}
