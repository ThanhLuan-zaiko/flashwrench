import type { PublicUser } from "@/lib/auth/user.types";
import type { WorkspaceResult } from "@/lib/booking/workspace.types";
import { monthKey } from "@/lib/mechanic/mechanic-period";
import { captureOperationsMetrics } from "./metric-capture.service";
import type { OperationsSnapshot } from "./metrics.types";
import { isMetricMonth, operationsSnapshot } from "./operations-metrics";

export async function getOperationsSnapshot(
  actor: PublicUser,
  month = monthKey(new Date()),
  now = new Date(),
): Promise<WorkspaceResult<OperationsSnapshot>> {
  if (actor.role !== "admin" && actor.role !== "dispatcher") {
    return { ok: false, status: 403, errors: { form: "Bạn không có quyền xem số liệu vận hành." } };
  }
  if (!isMetricMonth(month)) {
    return { ok: false, status: 400, errors: { month: "Tháng không hợp lệ (YYYY-MM)." } };
  }
  const captured = await captureOperationsMetrics(month);
  return { ok: true, data: operationsSnapshot(captured, month, now) };
}
