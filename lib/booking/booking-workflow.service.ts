import type { MechanicBookingRow } from "@/lib/mechanic/mechanic.types";
import { findBookingRowById } from "@/lib/mechanic/mechanic-bookings.repository";
import { MECHANIC_TIME_ZONE, monthKey } from "@/lib/mechanic/mechanic-period";
import {
  claimBookingTransition,
  projectBookingTransition,
  type ResolvedWorkflowWrite,
} from "./booking-workflow.repository";
import type { BookingWorkflowWrite } from "./booking-workflow.types";
import type { WorkspaceResult } from "./workspace.types";

export const BOOKING_CONFLICT_MESSAGE =
  "Đơn vừa được cập nhật. Vui lòng tải lại trước khi thao tác.";

export function nextTransitionAt(before: MechanicBookingRow): Date {
  const previous = before.updated_at?.getTime() ?? 0;
  return new Date(Math.max(Date.now(), previous + 1));
}

export async function transitionBooking(
  input: BookingWorkflowWrite,
): Promise<WorkspaceResult<MechanicBookingRow>> {
  const scheduledAt = input.before.scheduled_at;
  if (!(scheduledAt instanceof Date) || Number.isNaN(scheduledAt.getTime())) {
    return {
      ok: false,
      status: 400,
      errors: { form: "Đơn hàng thiếu lịch hẹn hợp lệ." },
    };
  }
  const write: ResolvedWorkflowWrite = {
    ...input,
    monthBucket:
      input.monthBucket ??
      input.before.month_bucket ??
      monthKey(scheduledAt, input.before.timezone ?? MECHANIC_TIME_ZONE),
  };
  let applied: boolean;
  try {
    applied = await claimBookingTransition(write);
  } catch (claimError) {
    // A conditional write can apply server-side even when the driver
    // reports an error (a write timeout racing a schema change, etc).
    // If the row already carries this exact write, continue to the
    // projection instead of stranding the booking half-transitioned.
    const fresh = await findBookingRowById(input.before.booking_id).catch(
      () => null,
    );
    const landed =
      fresh !== null &&
      fresh.status === write.status &&
      fresh.mechanic_id === write.mechanicId &&
      fresh.updated_at?.getTime() === write.at.getTime();
    if (!landed) throw claimError;
    applied = true;
  }
  if (!applied) {
    return {
      ok: false,
      status: 409,
      errors: { form: BOOKING_CONFLICT_MESSAGE },
    };
  }
  // The claim already moved bookings_by_id; if the projection throws here
  // the denormalized copies drift (stale status bucket, missing history).
  // The projection is idempotent, so retry once after a short pause to ride
  // out transient instability (e.g. the first LWT on a table creating its
  // paxos state mid-request). A second failure still propagates as a 500.
  try {
    await projectBookingTransition(write);
  } catch (firstError) {
    await new Promise((resolve) => setTimeout(resolve, 250));
    try {
      await projectBookingTransition(write);
    } catch (retryError) {
      console.error(
        `[booking] projection failed after retry for ${input.before.booking_id}`,
        retryError,
      );
      throw retryError;
    }
    console.warn(
      `[booking] transition projection recovered on retry for ${input.before.booking_id}`,
      firstError,
    );
  }
  return {
    ok: true,
    data: {
      ...write.before,
      status: write.status,
      mechanic_id: write.mechanicId,
      mechanic_name: write.mechanicName,
      cancel_reason:
        write.status === "cancelled" ? write.note : write.before.cancel_reason,
      updated_at: write.at,
    },
  };
}
