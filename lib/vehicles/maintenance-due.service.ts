// Keeps the next-due index in step with each completed visit. Called from
// the mechanic completion path: plan before the history row is written (so
// the previous due date is still the newest row), then sync after.

import {
  deleteDueRow,
  findLatestVisit,
  findServiceCadences,
  upsertDueRow,
} from "./maintenance-reminder.repository";
import {
  computeNextDue,
  dueMonthOf,
  type NextDue,
  reminderGroupOf,
} from "./maintenance-schedule";

export type VisitDuePlan = {
  previousDueAt: Date | null;
  next: NextDue;
};

// Best-effort: a failed lookup yields "no due date" rather than failing the
// completion that triggered it. The visit is still recorded.
export async function planVisitDue(params: {
  vehicleId: string;
  servedAt: Date;
  odometerKm: number | null;
  serviceIds: string[];
}): Promise<VisitDuePlan> {
  const empty: VisitDuePlan = {
    previousDueAt: null,
    next: { dueAt: null, dueKm: null },
  };
  try {
    const [latest, cadences] = await Promise.all([
      findLatestVisit(params.vehicleId),
      findServiceCadences([...new Set(params.serviceIds)]),
    ]);
    const next = computeNextDue({
      servedAt: params.servedAt,
      odometerKm: params.odometerKm,
      cadences,
    });
    return { previousDueAt: latest?.nextDueAt ?? null, next };
  } catch {
    return empty;
  }
}

// Guests have no account to remind, so a due row needs an owner.
export async function syncDueIndex(params: {
  vehicleId: string;
  ownerId: string | null;
  plan: VisitDuePlan;
}): Promise<void> {
  const { plan } = params;
  if (plan.previousDueAt) {
    await deleteDueRow(
      dueMonthOf(plan.previousDueAt),
      plan.previousDueAt,
      params.vehicleId,
    );
  }
  if (!plan.next.dueAt || !params.ownerId) return;
  await upsertDueRow({
    dueMonth: dueMonthOf(plan.next.dueAt),
    dueAt: plan.next.dueAt,
    vehicleId: params.vehicleId,
    ownerId: params.ownerId,
    nextDueKm: plan.next.dueKm,
    reminderGroup: reminderGroupOf(params.vehicleId),
  });
}
