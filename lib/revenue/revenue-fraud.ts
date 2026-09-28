// Heuristic anti-bribery flags computed over the range's period rows.
// Pure function so the rules are unit-testable; flags are review hints
// for admins, not automatic punishment.
import type { FraudFlag, PeriodPaymentRow } from "./revenue.types";

const RAPID_REPEAT_WINDOW_MS = 120_000;
const CASH_CONCENTRATION_THRESHOLD = 5;

const isPaid = (row: PeriodPaymentRow): boolean => row.status === "paid";
const isCash = (row: PeriodPaymentRow): boolean => row.method === "cod";
const isStaffHandled = (row: PeriodPaymentRow): boolean =>
  row.ref_type === "booking" || row.ref_type === "emergency";

function flag(
  kind: FraudFlag["kind"],
  severity: FraudFlag["severity"],
  refId: string | null,
  actorId: string | null,
  detail: string,
): FraudFlag {
  return { kind, severity, refId, actorId, detail };
}

/**
 * Scan period rows for suspicious collection patterns:
 * - unconfirmed-cod: cash collected without the customer's confirm code
 * - collector-mismatch: receipt recorded by someone other than the
 *   assigned mechanic (dispatcher/admin collections are visible too, so
 *   this is a review hint, not proof)
 * - cash-concentration: one actor records many cash receipts in a day
 * - rapid-repeat: two receipts on the same ref within two minutes —
 *   legitimate installments take longer than that in practice
 */
export function detectFraudFlags(rows: PeriodPaymentRow[]): FraudFlag[] {
  const flags: FraudFlag[] = [];

  for (const row of rows) {
    if (!isPaid(row) || !isStaffHandled(row)) continue;
    if (isCash(row) && row.customer_confirmed !== true) {
      flags.push(
        flag(
          "unconfirmed-cod",
          "critical",
          row.ref_id,
          row.recorded_by,
          `Thu tiền mặt không có mã xác nhận của khách (${row.payment_id}).`,
        ),
      );
    }
    if (
      row.mechanic_id &&
      row.recorded_by &&
      row.recorded_by !== row.mechanic_id
    ) {
      flags.push(
        flag(
          "collector-mismatch",
          "warning",
          row.ref_id,
          row.recorded_by,
          `Người ghi nhận thu khác thợ phụ trách đơn (${row.payment_id}).`,
        ),
      );
    }
  }

  const cashByActorDay = new Map<string, { count: number; actor: string }>();
  for (const row of rows) {
    if (!isPaid(row) || !isCash(row) || !row.recorded_by) continue;
    const key = `${row.recorded_by}:${row.bucket}`;
    const entry = cashByActorDay.get(key) ?? {
      count: 0,
      actor: row.recorded_by,
    };
    entry.count += 1;
    cashByActorDay.set(key, entry);
  }
  for (const [key, entry] of cashByActorDay) {
    if (entry.count < CASH_CONCENTRATION_THRESHOLD) continue;
    flags.push(
      flag(
        "cash-concentration",
        "warning",
        null,
        entry.actor,
        `Người thu ghi nhận ${entry.count} lượt tiền mặt trong ngày ${key.split(":")[1]}.`,
      ),
    );
  }

  const paidByRef = new Map<string, PeriodPaymentRow[]>();
  for (const row of rows) {
    if (!isPaid(row) || !row.ref_id || !(row.paid_at instanceof Date)) {
      continue;
    }
    const list = paidByRef.get(row.ref_id) ?? [];
    list.push(row);
    paidByRef.set(row.ref_id, list);
  }
  for (const [refId, list] of paidByRef) {
    if (list.length < 2) continue;
    const sorted = [...list].sort(
      (a, b) => (a.paid_at as Date).getTime() - (b.paid_at as Date).getTime(),
    );
    for (let index = 1; index < sorted.length; index += 1) {
      const prev = sorted[index - 1];
      const current = sorted[index];
      const gap =
        (current.paid_at as Date).getTime() - (prev.paid_at as Date).getTime();
      if (gap < RAPID_REPEAT_WINDOW_MS) {
        flags.push(
          flag(
            "rapid-repeat",
            "warning",
            refId,
            current.recorded_by,
            `Hai lượt thu cách nhau ${Math.round(gap / 1000)}s trên cùng đơn (${current.payment_id}).`,
          ),
        );
        break;
      }
    }
  }

  return flags;
}
