// I/O helpers for the dispatch pulse service: response-time sampling,
// open rescues and today's revenue. Each helper reads repositories (or a
// sibling service) and returns the plain shape the pulse needs.
import type { PublicUser } from "@/lib/auth/user.types";
import { metricHistoryPage } from "@/lib/operations/metrics.repository";
import { getDispatchRevenue } from "@/lib/revenue/revenue.service";
import { RESCUE_STAGES } from "./dispatch-pulse";
import { listOpenRescueRows } from "./dispatch-pulse.repository";
import type {
  PulseOpenRescue,
  PulseRescueStage,
  PulseRevenue,
} from "./dispatch-pulse.types";
import { firstResponseMinutes } from "./dispatch-pulse-response";

const RESPONSE_SAMPLE_LIMIT = 40;
const RESCUES_PER_STATUS = 10;
const OPEN_RESCUES_SHOWN = 6;

/** First-response minutes for up to N of today's handled bookings. */
export async function sampleResponseMinutes(
  bookingIds: readonly string[],
): Promise<(number | null)[]> {
  const sample = bookingIds.slice(0, RESPONSE_SAMPLE_LIMIT);
  return Promise.all(
    sample.map(async (bookingId) => {
      const page = await metricHistoryPage(bookingId, null);
      return firstResponseMinutes(page.rows);
    }),
  );
}

function stageOf(status: string): PulseRescueStage {
  const entry = (
    Object.entries(RESCUE_STAGES) as [PulseRescueStage, readonly string[]][]
  ).find(([, statuses]) => statuses.includes(status));
  return entry?.[0] ?? "waiting";
}

/** Oldest open rescues first — the longest wait sits on top. */
export async function loadOpenRescues(): Promise<PulseOpenRescue[]> {
  const statuses = Object.values(RESCUE_STAGES).flat();
  const pages = await Promise.all(
    statuses.map((status) => listOpenRescueRows(status, RESCUES_PER_STATUS)),
  );
  return pages
    .flat()
    .filter((row) => row.created_at !== null)
    .sort(
      (a, b) => (a.created_at?.getTime() ?? 0) - (b.created_at?.getTime() ?? 0),
    )
    .slice(0, OPEN_RESCUES_SHOWN)
    .map((row) => ({
      requestId: row.request_id,
      issueType: row.issue_type,
      priority: row.priority,
      status: row.status,
      stage: stageOf(row.status),
      createdAt: (row.created_at as Date).toISOString(),
    }));
}

/** Today's collected revenue; null when the report is unavailable. */
export async function loadTodayRevenue(
  actor: PublicUser,
): Promise<PulseRevenue | null> {
  const report = await getDispatchRevenue(actor, {
    range: "day",
    anchor: null,
  });
  if (!report.ok) return null;
  return {
    collected: report.data.collected,
    percent: report.data.previous.percent,
    series: report.data.series.map((point) => point.amount),
  };
}
