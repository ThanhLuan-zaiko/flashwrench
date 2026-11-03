import { decodeCursor, encodeCursor } from "@/lib/db/cursor";
import { MECHANIC_TIME_ZONE, monthKey } from "@/lib/mechanic/mechanic-period";
import { MAX_LIST_SEARCH_LENGTH, normalizeSearchText } from "@/lib/search-text";
import { toOrderSummary } from "./orders.mapper";
import { listOrderRowsByStatus } from "./orders.repository";
import {
  isOrderStatus,
  type OrderSummary,
  type OrdersResult,
} from "./orders.types";
import { failFields } from "./orders-result";
import { matchesOrderSearch } from "./orders-search";

const ORDERS_CURSOR_SCOPE = "dispatch-orders";
const ORDERS_PAGE_LIMIT = 20;

export type StaffOrdersParams = {
  status: string;
  month?: string;
  cursor?: string | null;
  limit?: string;
  search?: string;
};

export type StaffOrdersPage = {
  items: OrderSummary[];
  nextCursor: string | null;
};

// Dispatcher board: page one status partition of one month bucket.
export async function listStaffOrders(
  params: StaffOrdersParams,
): Promise<OrdersResult<StaffOrdersPage>> {
  if (!isOrderStatus(params.status)) {
    return failFields(400, { status: "Trạng thái đơn hàng không hợp lệ." });
  }
  const month = params.month ?? monthKey(new Date(), MECHANIC_TIME_ZONE);
  if (!/^\d{4}-\d{2}$/.test(month)) {
    return failFields(400, { status: "Tháng không hợp lệ." });
  }
  const limit = Math.min(
    Math.max(Number.parseInt(params.limit ?? "", 10) || ORDERS_PAGE_LIMIT, 1),
    50,
  );
  const rawSearch = params.search ?? "";
  if (rawSearch.length > MAX_LIST_SEARCH_LENGTH) {
    return failFields(400, { form: "Từ khóa tìm kiếm không hợp lệ." });
  }
  const search = normalizeSearchText(rawSearch);
  const scope = search
    ? `${ORDERS_CURSOR_SCOPE}:search:${search}`
    : ORDERS_CURSOR_SCOPE;
  let pageState: string | null = null;
  try {
    pageState = decodeCursor(params.cursor ?? null, scope);
  } catch {
    return failFields(400, { status: "Con trỏ phân trang không hợp lệ." });
  }

  // Search walks the status partition page by page until it fills one
  // board page, so the cursor always resumes exactly where the walk stopped.
  const items: OrderSummary[] = [];
  let shouldContinue = true;
  while (shouldContinue && items.length < limit) {
    const previousPageState: string | null = pageState;
    const page = await listOrderRowsByStatus(
      params.status,
      month,
      limit - items.length,
      pageState,
    );
    const summaries = page.rows.map(toOrderSummary);
    const matching = search
      ? summaries.filter((order) => matchesOrderSearch(order, search))
      : summaries;
    items.push(...matching.slice(0, limit - items.length));
    pageState = page.pageState;
    shouldContinue = Boolean(
      search && pageState && pageState !== previousPageState,
    );
  }

  return {
    ok: true,
    data: {
      items,
      nextCursor: encodeCursor(pageState, scope),
    },
  };
}
