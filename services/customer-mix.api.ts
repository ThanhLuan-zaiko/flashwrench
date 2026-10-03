import type {
  CustomerMixReport,
  MixRange,
} from "@/lib/customer-mix/customer-mix.types";
import { AuthApiError, apiRequest } from "./auth.api";

export type { CustomerMixReport, MixRange };
export { AuthApiError };

export type CustomerMixQuery = {
  range: MixRange;
  /** YYYY-MM-DD anchor inside the requested range; omitted = today. */
  anchor?: string;
};

function toQueryString(query: CustomerMixQuery): string {
  const params = new URLSearchParams({ range: query.range });
  if (query.anchor) params.set("anchor", query.anchor);
  return `?${params}`;
}

export function fetchDispatchCustomerMix(
  query: CustomerMixQuery,
): Promise<CustomerMixReport> {
  return apiRequest<CustomerMixReport>(
    `/api/dispatch/customer-mix${toQueryString(query)}`,
  );
}

export function fetchAdminCustomerMix(
  query: CustomerMixQuery,
): Promise<CustomerMixReport> {
  return apiRequest<CustomerMixReport>(
    `/api/admin/customer-mix${toQueryString(query)}`,
  );
}
