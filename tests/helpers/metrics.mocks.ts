import { mock } from "bun:test";
import type { MechanicReviewRow } from "@/lib/mechanic/mechanic.types";
import type { MetricPage, MetricReceipt } from "@/lib/operations/metrics.types";

export const metricStubs = {
  refs: new Map<string, MetricPage<string>>(),
  receipts: new Map<string, MetricReceipt>(),
  history: new Map<string, MetricPage<{ status: string | null; at: Date | null }>>(),
  reviews: new Map<string, MetricPage<MechanicReviewRow>>(),
};

export function metricStubKey(id: string, state: string | null): string {
  return `${id}:${state ?? "first"}`;
}

export const metricRepoMocks = {
  metricPaymentRefs: mock(async (id: string, state: string | null) => metricStubs.refs.get(metricStubKey(id, state)) ?? { rows: [], pageState: null }),
  metricReceiptById: mock(async (id: string) => metricStubs.receipts.get(id) ?? null),
  metricHistoryPage: mock(async (id: string, state: string | null) => metricStubs.history.get(metricStubKey(id, state)) ?? { rows: [], pageState: null }),
  metricReviewPage: mock(async (id: string, state: string | null) => metricStubs.reviews.get(metricStubKey(id, state)) ?? { rows: [], pageState: null }),
};

export function resetMetricMocks(): void {
  metricStubs.refs.clear();
  metricStubs.receipts.clear();
  metricStubs.history.clear();
  metricStubs.reviews.clear();
  for (const fn of Object.values(metricRepoMocks)) fn.mockClear();
}
