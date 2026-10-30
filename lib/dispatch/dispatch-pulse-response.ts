// Pure response-time math for the dispatch pulse gauge. Booking creation
// writes a history row into "pending"; the first later row with another
// status is the dispatcher's first action (confirm, assign or cancel).

export const RESPONSE_THRESHOLD_MINUTES = 10;

export type HistoryPoint = { status: string | null; at: Date | null };

/** Minutes from creation to the first non-pending status, or null. */
export function firstResponseMinutes(
  history: readonly HistoryPoint[],
): number | null {
  const valid = history
    .filter(
      (row): row is { status: string; at: Date } =>
        row.status !== null &&
        row.at instanceof Date &&
        Number.isFinite(row.at.getTime()),
    )
    .sort((a, b) => a.at.getTime() - b.at.getTime());
  const created = valid.find((row) => row.status === "pending");
  if (!created) return null;
  const responded = valid.find(
    (row) =>
      row.status !== "pending" && row.at.getTime() >= created.at.getTime(),
  );
  if (!responded) return null;
  return (responded.at.getTime() - created.at.getTime()) / 60_000;
}

export type ResponseSummary = {
  avgMinutes: number | null;
  samples: number;
  overThreshold: number;
};

export function summarizeResponses(
  minutes: readonly (number | null)[],
  thresholdMinutes = RESPONSE_THRESHOLD_MINUTES,
): ResponseSummary {
  const values = minutes.filter(
    (value): value is number => value !== null && value >= 0,
  );
  if (values.length === 0) {
    return { avgMinutes: null, samples: 0, overThreshold: 0 };
  }
  const total = values.reduce((sum, value) => sum + value, 0);
  return {
    avgMinutes: Math.round((total / values.length) * 10) / 10,
    samples: values.length,
    overThreshold: values.filter((value) => value > thresholdMinutes).length,
  };
}
