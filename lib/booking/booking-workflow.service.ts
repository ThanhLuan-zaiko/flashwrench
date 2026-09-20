import type { MechanicBookingRow } from "@/lib/mechanic/mechanic.types";
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
  const applied = await claimBookingTransition(write);
  if (!applied) {
    return {
      ok: false,
      status: 409,
      errors: { form: BOOKING_CONFLICT_MESSAGE },
    };
  }
  await projectBookingTransition(write);
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
