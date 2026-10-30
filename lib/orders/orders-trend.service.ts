// Parts-order trend for the dispatch and admin order screens: orders and
// value per day over the last two weeks, from the status partitions.
import type { PublicUser } from "@/lib/auth/user.types";
import type { WorkspaceResult } from "@/lib/booking/workspace.types";
import { ORDER_STATUSES } from "./orders.types";
import {
  buildOrderTrend,
  type OrderTrendPoint,
  trendMonthBuckets,
} from "./orders-trend";
import { listOrderTrendRows } from "./orders-trend.repository";

const PAGE_LIMIT = 500;
const STAFF_ROLES = new Set(["dispatcher", "admin"]);

export type OrderTrend = {
  points: OrderTrendPoint[];
  /** True when a status partition hit the page cap; counts are partial. */
  truncated: boolean;
};

export async function getOrderTrend(
  actor: PublicUser,
  now = new Date(),
): Promise<WorkspaceResult<OrderTrend>> {
  if (!STAFF_ROLES.has(actor.role)) {
    return {
      ok: false,
      status: 403,
      errors: { form: "Bạn không có quyền xem thống kê đơn hàng." },
    };
  }
  const months = trendMonthBuckets(now);
  let truncated = false;
  const groups = await Promise.all(
    ORDER_STATUSES.map(async (status) => {
      const pages = await Promise.all(
        months.map((month) => listOrderTrendRows(status, month, PAGE_LIMIT)),
      );
      if (pages.some((page) => page.pageState)) truncated = true;
      return { status, rows: pages.flatMap((page) => page.rows) };
    }),
  );
  return {
    ok: true,
    data: { points: buildOrderTrend(groups, now), truncated },
  };
}
