import type {
  PaymentAuditEvent,
  RevenueReport,
} from "@/lib/revenue/revenue.types";
import type { RevenueRange } from "@/lib/revenue/revenue-period";
import { AuthApiError, apiRequest } from "./auth.api";

export type { PaymentAuditEvent, RevenueReport, RevenueRange };
export { AuthApiError };

export type RevenueQuery = {
  range: RevenueRange;
  /** YYYY-MM-DD anchor inside the requested range; omitted = today. */
  anchor?: string;
};

function toQueryString(query: RevenueQuery): string {
  const params = new URLSearchParams({ range: query.range });
  if (query.anchor) params.set("anchor", query.anchor);
  return `?${params}`;
}

export function fetchDispatchRevenue(
  query: RevenueQuery,
): Promise<RevenueReport> {
  return apiRequest<RevenueReport>(
    `/api/dispatch/revenue${toQueryString(query)}`,
  );
}

export function fetchAdminRevenue(query: RevenueQuery): Promise<RevenueReport> {
  return apiRequest<RevenueReport>(`/api/admin/revenue${toQueryString(query)}`);
}

export function fetchPaymentAudit(
  query: RevenueQuery,
): Promise<{ events: PaymentAuditEvent[]; label: string }> {
  return apiRequest<{ events: PaymentAuditEvent[]; label: string }>(
    `/api/admin/revenue/audit${toQueryString(query)}`,
  );
}

// CSV downloads go through a plain anchor so the browser streams the file;
// these helpers just build the URL for it.
export function dispatchRevenueCsvHref(query: RevenueQuery): string {
  return `/api/dispatch/revenue/csv${toQueryString(query)}`;
}

export function adminRevenueCsvHref(query: RevenueQuery): string {
  return `/api/admin/revenue/csv${toQueryString(query)}`;
}
