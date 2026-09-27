// Dispatcher manual override for rescue auto-dispatch: hand-assign a
// mechanic, cancel a rescue, or force-expire a stuck 30s offer. The
// system still auto-offers first; humans only take over exceptions.
// Optimistic concurrency via expectedUpdatedAt, like booking dispatch.
import type { PublicUser } from "@/lib/auth/user.types";
import { isMechanicEligible } from "@/lib/mechanic/mechanic-assignment.service";
import { findMechanicProfileRow } from "@/lib/mechanic/mechanic-workspace.repository";
import { publishRescueChange } from "@/lib/realtime/domain-publish";
import { isRecord, isUuid } from "@/lib/validation";
import type { RescueActionResult } from "./rescue.types";
import { expireRescueOffer } from "./rescue-dispatch.service";
import { isRescueStatus } from "./rescue-status";
import {
  claimRescueTransition,
  findRescueRowById,
  projectRescueTransition,
} from "./rescue-workflow.repository";

export type DispatchRescueAction = "assign" | "cancel" | "expire-now";

export type DispatchRescueOutcome = {
  requestId: string;
  status: string;
  assignedMechanicId: string | null;
  assignedMechanicName: string | null;
};

const ASSIGNABLE_STATUSES = new Set(["open", "dispatched", "accepted"]);
const CANCELLABLE_STATUSES = new Set(["open", "dispatched", "accepted"]);
const MAX_NOTE = 300;

function fail<T>(status: number, form: string): RescueActionResult<T> {
  return { ok: false, status, errors: { form } };
}

function isAction(value: unknown): value is DispatchRescueAction {
  return value === "assign" || value === "cancel" || value === "expire-now";
}

function isDispatcher(actor: PublicUser): boolean {
  return actor.role === "dispatcher" || actor.role === "admin";
}

export async function applyDispatchRescueAction(
  actor: PublicUser,
  requestId: string,
  raw: unknown,
): Promise<RescueActionResult<DispatchRescueOutcome>> {
  if (!isDispatcher(actor)) {
    return fail(403, "Bạn không có quyền thực hiện thao tác này.");
  }
  if (!isUuid(requestId)) {
    return fail(400, "Mã yêu cầu cứu hộ không hợp lệ.");
  }
  if (!isRecord(raw) || !isAction(raw.action)) {
    return {
      ok: false,
      status: 400,
      errors: { action: "Thao tác không hợp lệ." },
    };
  }
  const action = raw.action;

  if (
    !("expectedUpdatedAt" in raw) ||
    (raw.expectedUpdatedAt !== null &&
      typeof raw.expectedUpdatedAt !== "string")
  ) {
    return {
      ok: false,
      status: 400,
      errors: { expectedUpdatedAt: "Thiếu phiên bản yêu cầu." },
    };
  }

  const note =
    typeof raw.note === "string" ? raw.note.trim().replace(/\s+/g, " ") : "";
  if (
    raw.note !== undefined &&
    raw.note !== null &&
    typeof raw.note !== "string"
  ) {
    return {
      ok: false,
      status: 400,
      errors: { note: "Ghi chú không hợp lệ." },
    };
  }
  if (note.length > MAX_NOTE) {
    return {
      ok: false,
      status: 400,
      errors: { note: `Ghi chú tối đa ${MAX_NOTE} ký tự.` },
    };
  }
  if (action === "cancel" && note.length === 0) {
    return {
      ok: false,
      status: 400,
      errors: { note: "Vui lòng nhập lý do hủy ca cứu hộ." },
    };
  }

  const row = await findRescueRowById(requestId);
  if (!row) return fail(404, "Không tìm thấy yêu cầu cứu hộ này.");
  const current = isRescueStatus(row.status) ? row.status : null;
  if (!current) {
    return fail(400, "Yêu cầu đang ở trạng thái không xác định.");
  }
  const canonicalUpdatedAt = row.updated_at?.toISOString() ?? null;
  if (raw.expectedUpdatedAt !== canonicalUpdatedAt) {
    return fail(
      409,
      "Yêu cầu vừa được cập nhật. Vui lòng tải lại trước khi thao tác.",
    );
  }

  if (action === "expire-now") {
    if (current !== "dispatched") {
      return {
        ok: false,
        status: 400,
        errors: { action: "Chỉ có thể hết hạn ca đang giao thợ." },
      };
    }
    const outcome = await expireRescueOffer(requestId, new Date(), {
      force: true,
    });
    const fresh = await findRescueRowById(requestId);
    return {
      ok: true,
      data: {
        requestId,
        status: fresh?.status ?? (outcome.expired ? "open" : current),
        assignedMechanicId: fresh?.assigned_mechanic_id ?? null,
        assignedMechanicName: fresh?.assigned_mechanic_name ?? null,
      },
    };
  }

  if (action === "assign") {
    if (!ASSIGNABLE_STATUSES.has(current)) {
      return {
        ok: false,
        status: 400,
        errors: { action: "Ca ở trạng thái này không thể phân công." },
      };
    }
    const mechanicId = raw.mechanicId;
    if (!isUuid(mechanicId)) {
      return {
        ok: false,
        status: 400,
        errors: { mechanicId: "Thợ không hợp lệ." },
      };
    }
    if (row.assigned_mechanic_id === mechanicId && current === "dispatched") {
      return fail(409, "Thợ này đã được giao ca cứu hộ.");
    }
    if (!(await isMechanicEligible(mechanicId))) {
      return fail(409, "Thợ đã chọn hiện không khả dụng.");
    }
    const profile = await findMechanicProfileRow(mechanicId);
    const mechanicName = profile?.display_name?.trim() || "Thợ FlashWrench";
    const at = new Date();
    const applied = await claimRescueTransition({
      before: row,
      status: "dispatched",
      mechanicId,
      mechanicName,
      actorId: actor.id,
      note: note.length > 0 ? note : "Điều phối viên giao thợ.",
      at,
    });
    if (!applied) {
      return fail(
        409,
        "Yêu cầu vừa được cập nhật. Vui lòng tải lại trước khi thao tác.",
      );
    }
    await projectRescueTransition({
      before: row,
      status: "dispatched",
      mechanicId,
      mechanicName,
      actorId: actor.id,
      note: note.length > 0 ? note : "Điều phối viên giao thợ.",
      at,
    });
    await publishRescueChange(
      "rescue-assigned",
      requestId,
      "dispatched",
      row.customer_id,
      [row.assigned_mechanic_id, mechanicId],
      row.zone_id,
    );
    return {
      ok: true,
      data: {
        requestId,
        status: "dispatched",
        assignedMechanicId: mechanicId,
        assignedMechanicName: mechanicName,
      },
    };
  }

  if (!CANCELLABLE_STATUSES.has(current)) {
    return {
      ok: false,
      status: 400,
      errors: { action: "Ca ở trạng thái này không thể hủy." },
    };
  }
  const at = new Date();
  const applied = await claimRescueTransition({
    before: row,
    status: "cancelled",
    mechanicId: null,
    mechanicName: null,
    actorId: actor.id,
    note,
    at,
  });
  if (!applied) {
    return fail(
      409,
      "Yêu cầu vừa được cập nhật. Vui lòng tải lại trước khi thao tác.",
    );
  }
  await projectRescueTransition({
    before: row,
    status: "cancelled",
    mechanicId: null,
    mechanicName: null,
    actorId: actor.id,
    note,
    at,
  });
  await publishRescueChange(
    "rescue-updated",
    requestId,
    "cancelled",
    row.customer_id,
    row.assigned_mechanic_id ? [row.assigned_mechanic_id] : [],
    row.zone_id,
  );
  return {
    ok: true,
    data: {
      requestId,
      status: "cancelled",
      assignedMechanicId: null,
      assignedMechanicName: null,
    },
  };
}
