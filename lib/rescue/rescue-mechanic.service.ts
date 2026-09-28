// Mechanic actions on a rescue: answer the 30s offer (accept/decline),
// then drive the journey — depart, arrive, complete — so customers and
// dispatchers see live progress. Dispatchers monitor the same rows in
// parallel via realtime.

import {
  estimateEtaMin,
  type GeoPoint,
  haversineKm,
  isValidLatitude,
  isValidLongitude,
} from "@/lib/mechanic/mechanic-geo";
import {
  findMechanicLocationRow,
  findMechanicProfileRow,
} from "@/lib/mechanic/mechanic-workspace.repository";
import { publishRescueChange } from "@/lib/realtime/domain-publish";
import { isUuid } from "@/lib/validation";
import type { RescueResult } from "./rescue.types";
import { redispatchAfterDecline } from "./rescue-dispatch.service";
import {
  canApplyRescueAction,
  isRescueMechanicAction,
  isRescueStatus,
  type RescueMechanicAction,
  type RescueStatus,
  rescueActionTarget,
} from "./rescue-status";
import {
  claimRescueTransition,
  findRescueRowById,
  projectRescueTransition,
  type RescueRow,
} from "./rescue-workflow.repository";

export type RescueMechanicOutcome = {
  requestId: string;
  status: string;
  assignedMechanicId: string | null;
  assignedMechanicName: string | null;
  etaMin: number | null;
};

const ACTION_NOTES: Record<RescueMechanicAction, string> = {
  accept: "Thợ nhận cứu hộ.",
  decline: "Thợ từ chối cứu hộ.",
  expire: "Hết thời gian chờ xác nhận.",
  depart: "Thợ đang di chuyển tới điểm cứu hộ.",
  arrive: "Thợ đã đến điểm cứu hộ.",
  complete: "Thợ báo hoàn tất cứu hộ.",
};

function fail<T>(status: number, form: string): RescueResult<T> {
  return { ok: false, status, errors: { form } };
}

function isGeoPoint(point: {
  lat: number | null;
  lng: number | null;
}): point is GeoPoint {
  return isValidLatitude(point.lat) && isValidLongitude(point.lng);
}

// ETA hint at departure: live GPS position first, garage base second,
// rescue pin as destination. Missing either side yields null instead of
// a fabricated number.
async function departureEtaMin(
  mechanicId: string,
  row: RescueRow,
): Promise<number | null> {
  const destination = { lat: row.address_lat, lng: row.address_lng };
  if (!isGeoPoint(destination)) return null;
  const [location, profile] = await Promise.all([
    findMechanicLocationRow(mechanicId),
    findMechanicProfileRow(mechanicId),
  ]);
  const live = { lat: location?.lat ?? null, lng: location?.lng ?? null };
  const base = {
    lat: profile?.base_lat ?? null,
    lng: profile?.base_lng ?? null,
  };
  const origin = isGeoPoint(live) ? live : isGeoPoint(base) ? base : null;
  if (!origin) return null;
  return estimateEtaMin(haversineKm(origin, destination));
}

function keepsMechanic(action: RescueMechanicAction): boolean {
  return (
    action === "accept" ||
    action === "depart" ||
    action === "arrive" ||
    action === "complete"
  );
}

function outcome(
  requestId: string,
  status: RescueStatus,
  row: RescueRow,
  mechanicId: string | null,
  etaMin: number | null,
): RescueMechanicOutcome {
  return {
    requestId,
    status,
    assignedMechanicId: mechanicId,
    assignedMechanicName: mechanicId ? row.assigned_mechanic_name : null,
    etaMin,
  };
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
  // Expire is system-driven; mechanics only act on their own offer/trip.
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

  const nextStatus = rescueActionTarget(action);
  const nextMechanicId = keepsMechanic(action) ? mechanicId : null;
  const etaMin =
    action === "depart" ? await departureEtaMin(mechanicId, row) : null;
  const at = new Date();
  const note = ACTION_NOTES[action];
  const applied = await claimRescueTransition({
    before: row,
    status: nextStatus,
    mechanicId: nextMechanicId,
    mechanicName: nextMechanicId ? row.assigned_mechanic_name : null,
    etaMin,
    actorId: mechanicId,
    note,
    at,
  });
  if (!applied) {
    return fail(409, "Yêu cầu vừa được cập nhật. Vui lòng tải lại.");
  }
  await projectRescueTransition({
    before: row,
    status: nextStatus,
    mechanicId: nextMechanicId,
    mechanicName: nextMechanicId ? row.assigned_mechanic_name : null,
    etaMin,
    actorId: mechanicId,
    note,
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
    data: outcome(requestId, nextStatus, row, nextMechanicId, etaMin),
  };
}
