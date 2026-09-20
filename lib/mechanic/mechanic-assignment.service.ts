import { findUserById } from "@/lib/auth/user.repository";
import {
  deleteMechanicActiveJob,
  findBookingRowById,
  findMechanicActiveJob,
  insertMechanicActiveJob,
  listBookingRowsByIds,
  listWorkloadPage,
  listWorkloadRowsInRange,
} from "./mechanic-bookings.repository";
import { syncMechanicDirectory } from "./mechanic-directory.service";
import { toBookingStatus } from "./mechanic-mapper";
import { isTerminalBookingStatus } from "./mechanic-status";
import {
  findMechanicProfileRow,
  setMechanicAvailability,
} from "./mechanic-workspace.repository";

export const WORKLOAD_SCAN_LIMIT = 61;
export const DISPATCH_OVERLAP_WINDOW_MS = 60 * 60 * 1000;

const ACTIVE_JOB_STATUSES = new Set(["en_route", "in_progress"]);

export type MechanicJobReservation = {
  allowed: boolean;
  acquired: boolean;
};

export async function reserveMechanicJob(
  mechanicId: string,
  bookingId: string,
): Promise<MechanicJobReservation> {
  const existing = await findMechanicActiveJob(mechanicId);
  if (existing) {
    return existing === bookingId
      ? { allowed: true, acquired: false }
      : { allowed: false, acquired: false };
  }
  const acquired = await insertMechanicActiveJob(mechanicId, bookingId);
  if (acquired) return { allowed: true, acquired: true };
  const concurrent = await findMechanicActiveJob(mechanicId);
  return concurrent === bookingId
    ? { allowed: true, acquired: false }
    : { allowed: false, acquired: false };
}

export async function releaseMechanicJob(
  mechanicId: string,
  bookingId: string,
): Promise<void> {
  await deleteMechanicActiveJob(mechanicId, bookingId);
}

export async function releaseReservationIfUnclaimed(
  mechanicId: string,
  bookingId: string,
): Promise<void> {
  let row;
  try {
    row = await findBookingRowById(bookingId);
  } catch {
    return;
  }
  const status = row ? toBookingStatus(row.status) : null;
  const winnerHolds =
    row?.mechanic_id === mechanicId &&
    (status === "en_route" || status === "in_progress");
  if (!winnerHolds) {
    await deleteMechanicActiveJob(mechanicId, bookingId);
  }
}

export async function hasActiveBooking(
  mechanicId: string,
  excludeBookingId?: string,
): Promise<boolean> {
  let pageState: string | null = null;
  do {
    const page = await listWorkloadPage(mechanicId, pageState);
    const ids = page.rows
      .map((row) => row.booking_id)
      .filter((id) => id !== excludeBookingId);
    if (ids.length > 0) {
      const details = await listBookingRowsByIds(ids);
      const busy = details.some(
        (detail) =>
          detail.mechanic_id === mechanicId &&
          ACTIVE_JOB_STATUSES.has(detail.status ?? ""),
      );
      if (busy) return true;
    }
    pageState = page.pageState;
  } while (pageState);
  return false;
}

export async function isMechanicEligible(mechanicId: string): Promise<boolean> {
  const [user, profile, activeJob] = await Promise.all([
    findUserById(mechanicId),
    findMechanicProfileRow(mechanicId),
    findMechanicActiveJob(mechanicId),
  ]);
  if (!user || user.role !== "mechanic" || user.status !== "active") {
    return false;
  }
  if (activeJob !== null) return false;
  if (!profile) return false;
  return (
    profile.is_verified === true &&
    profile.is_online === true &&
    profile.is_available === true
  );
}

export async function mechanicScheduleConflict(
  mechanicId: string,
  scheduledAt: Date,
  excludeBookingId?: string,
): Promise<boolean | "overflow"> {
  const at = scheduledAt.getTime();
  const rows = await listWorkloadRowsInRange(
    mechanicId,
    new Date(at - DISPATCH_OVERLAP_WINDOW_MS),
    new Date(at + DISPATCH_OVERLAP_WINDOW_MS),
    WORKLOAD_SCAN_LIMIT,
  );
  if (rows.length >= WORKLOAD_SCAN_LIMIT) return "overflow";
  const candidates = rows.filter((row) => row.booking_id !== excludeBookingId);
  if (candidates.length === 0) return false;
  const details = await listBookingRowsByIds(
    candidates.map((row) => row.booking_id),
  );
  return details.some((detail) => {
    if (detail.mechanic_id !== mechanicId) return false;
    const status = toBookingStatus(detail.status);
    if (!status || isTerminalBookingStatus(status)) return false;
    const other = detail.scheduled_at?.getTime();
    if (other === undefined || other === null) return false;
    return Math.abs(other - at) <= DISPATCH_OVERLAP_WINDOW_MS;
  });
}

export async function releaseMechanicIfIdle(
  mechanicId: string,
  excludeBookingId: string,
  at: Date,
): Promise<void> {
  const activeJob = await findMechanicActiveJob(mechanicId);
  if (activeJob !== null && activeJob !== excludeBookingId) return;
  if (activeJob === excludeBookingId) {
    await deleteMechanicActiveJob(mechanicId, excludeBookingId);
  }
  if (await hasActiveBooking(mechanicId, excludeBookingId)) return;
  await setMechanicAvailability(mechanicId, true, at);
  await syncMechanicDirectory(mechanicId);
}
