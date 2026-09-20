import type {
  MechanicIncomeEntry,
  MechanicIncomeState,
  MechanicIncomeSummary,
  MechanicMonthlyPoint,
  MechanicRatingBucket,
  MechanicReviewItem,
  MechanicStats,
} from "./mechanic.types";
import type { MetricCoverage } from "@/lib/operations/metrics.types";

export type IncomeMetricEntry = MechanicIncomeEntry & {
  received: number;
  outstanding: number;
};

export type MetricPagination = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export type MechanicMetricScope = MetricCoverage & { kind: "assigned-history" };

export type MechanicIncomeSnapshot = {
  summary: MechanicIncomeSummary;
  entries: IncomeMetricEntry[];
  counts: Record<MechanicIncomeState | "all", number>;
  pagination: MetricPagination;
  scope: MechanicMetricScope;
  truncated: boolean;
};

export type MechanicStatsSnapshot = {
  stats: MechanicStats;
  monthly: MechanicMonthlyPoint[];
  ratings: MechanicRatingBucket[];
  reviews: MechanicReviewItem[];
  reviewPagination: MetricPagination;
  scope: MechanicMetricScope;
};

export function metricPagination(total: number, page: number, pageSize: number): MetricPagination {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  return { page: Math.min(page, totalPages), pageSize, total, totalPages };
}

export function validMetricPaging(page: number, size: number): boolean {
  return Number.isSafeInteger(page) && page >= 1 && Number.isInteger(size) && size >= 1 && size <= 50;
}
