// Shared repository/service stubs for the voucher auto-grant suites.
// The stats map models a real CAS column compare and the dedupe ledger a
// real IF NOT EXISTS claim, so evaluator tests exercise retry/race paths
// against storage semantics, not canned booleans. Extend these handles
// instead of inventing file-local mocks for the same modules.
import { mock } from "bun:test";
import type { WinBackScanResult } from "@/lib/vouchers/auto-grant-winback.service";
import type { InsertAutoRuleParams } from "@/lib/vouchers/auto-rule.repository";
import type { NearMilestonePage } from "@/lib/vouchers/auto-rule.service";
import type {
  AutoRuleResult,
  AutoRuleRow,
  CustomerStatsRow,
  VoucherAutoRule,
} from "@/lib/vouchers/auto-rule.types";

export const autoRuleStubs = {
  ruleRows: [] as AutoRuleRow[],
  // Extra row used when a test wants a rule the list does not return.
  ruleById: null as AutoRuleRow | null,
  statsByCustomer: new Map<string, CustomerStatsRow>(),
  statsScanRows: [] as CustomerStatsRow[],
  // The dedupe ledger as claimed keys "rule:user:dedupeKey".
  dedupeLedger: new Map<string, { walletId: string; grantedAt: Date }>(),
  releasedDedupe: [] as string[],
  insertedRules: [] as InsertAutoRuleParams[],
  setActiveCalls: [] as { ruleId: string; isActive: boolean }[],
  grantCountBumps: [] as string[],
  // CAS plan for the stats rollup: each entry consumed per
  // casUpdateCustomerStats call — "win" applies, "lose" pretends a peer
  // committed first (the stored row gains the peer's +1 booking).
  statsCasPlan: [] as ("win" | "lose")[],
  // When > 0, insertCustomerStatsIfAbsent loses the race and seeds the
  // map with `statsPeerRow` (or the incoming row) before returning false.
  statsInsertLoses: 0,
  statsPeerRow: null as CustomerStatsRow | null,
  bookingRefs: [] as {
    status: string | null;
    total: number | null;
    at: Date | null;
  }[],
  orderRefs: [] as {
    status: string | null;
    total: number | null;
    at: Date | null;
  }[],
};

function findRuleRow(ruleId: string): AutoRuleRow | null {
  return (
    autoRuleStubs.ruleRows.find((row) => row.rule_id === ruleId) ??
    (autoRuleStubs.ruleById?.rule_id === ruleId ? autoRuleStubs.ruleById : null)
  );
}

export const autoRuleRepoMocks = {
  listAutoRuleRows: mock(async (): Promise<AutoRuleRow[]> => {
    if (autoRuleStubs.ruleById && !findInList(autoRuleStubs.ruleById)) {
      return [...autoRuleStubs.ruleRows, autoRuleStubs.ruleById];
    }
    return autoRuleStubs.ruleRows;
  }),
  findAutoRuleRowById: mock(
    async (ruleId: string): Promise<AutoRuleRow | null> => findRuleRow(ruleId),
  ),
  insertAutoRule: mock(async (params: InsertAutoRuleParams): Promise<void> => {
    autoRuleStubs.insertedRules.push(params);
    autoRuleStubs.ruleRows.push({
      rule_id: params.ruleId,
      name: params.name,
      campaign_id: params.campaignId,
      trigger_type: params.triggerType,
      threshold: params.threshold,
      window_days: params.windowDays,
      is_active: params.isActive,
      granted_count: 0,
      created_by: params.createdBy,
      created_at: params.now,
      updated_at: params.now,
    });
  }),
  setAutoRuleActive: mock(
    async (ruleId: string, isActive: boolean): Promise<void> => {
      autoRuleStubs.setActiveCalls.push({ ruleId, isActive });
      const row = findRuleRow(ruleId);
      if (row) row.is_active = isActive;
    },
  ),
  bumpRuleGrantedCount: mock(async (ruleId: string): Promise<void> => {
    autoRuleStubs.grantCountBumps.push(ruleId);
    const row = findRuleRow(ruleId);
    if (row) row.granted_count = (row.granted_count ?? 0) + 1;
  }),
  // IF NOT EXISTS over (rule_id, user_id, dedupe_key).
  claimAutoGrantDedupe: mock(
    async (
      ruleId: string,
      userId: string,
      dedupeKey: string,
      walletId: string,
      now: Date,
    ): Promise<boolean> => {
      const key = `${ruleId}:${userId}:${dedupeKey}`;
      if (autoRuleStubs.dedupeLedger.has(key)) return false;
      autoRuleStubs.dedupeLedger.set(key, { walletId, grantedAt: now });
      return true;
    },
  ),
  releaseAutoGrantDedupe: mock(
    async (
      ruleId: string,
      userId: string,
      dedupeKey: string,
    ): Promise<void> => {
      const key = `${ruleId}:${userId}:${dedupeKey}`;
      autoRuleStubs.dedupeLedger.delete(key);
      autoRuleStubs.releasedDedupe.push(key);
    },
  ),
  findCustomerStatsRow: mock(
    async (customerId: string): Promise<CustomerStatsRow | null> =>
      autoRuleStubs.statsByCustomer.get(customerId) ?? null,
  ),
  insertCustomerStatsIfAbsent: mock(
    async (row: CustomerStatsRow): Promise<boolean> => {
      if (autoRuleStubs.statsInsertLoses > 0) {
        autoRuleStubs.statsInsertLoses -= 1;
        // The peer that won the race lands its row; ours is dropped.
        autoRuleStubs.statsByCustomer.set(
          row.customer_id,
          autoRuleStubs.statsPeerRow ?? row,
        );
        return false;
      }
      if (autoRuleStubs.statsByCustomer.has(row.customer_id)) return false;
      autoRuleStubs.statsByCustomer.set(row.customer_id, { ...row });
      return true;
    },
  ),
  // Real CAS compare on the numeric columns: a stale `before` loses.
  casUpdateCustomerStats: mock(
    async (
      before: CustomerStatsRow,
      next: Omit<CustomerStatsRow, "updated_at" | "customer_id">,
    ): Promise<boolean> => {
      const plan = autoRuleStubs.statsCasPlan.shift() ?? "win";
      const row = autoRuleStubs.statsByCustomer.get(before.customer_id);
      if (!row) return false;
      if (plan === "lose") {
        // A peer event commits in between — stored counts move on.
        autoRuleStubs.statsByCustomer.set(before.customer_id, {
          ...row,
          completed_bookings: (row.completed_bookings ?? 0) + 1,
        });
        return false;
      }
      const matches =
        row.completed_bookings === before.completed_bookings &&
        row.completed_orders === before.completed_orders &&
        row.total_spent === before.total_spent;
      if (!matches) return false;
      autoRuleStubs.statsByCustomer.set(before.customer_id, {
        ...row,
        ...next,
        updated_at: new Date(),
      });
      return true;
    },
  ),
  listCustomerStatsRows: mock(
    async (limit: number): Promise<CustomerStatsRow[]> =>
      autoRuleStubs.statsScanRows.slice(0, Math.min(Math.max(limit, 1), 5000)),
  ),
  listCustomerBookingRefs: mock(
    async (
      _customerId: string,
    ): Promise<
      { status: string | null; total: number | null; at: Date | null }[]
    > => autoRuleStubs.bookingRefs,
  ),
  listCustomerOrderRefs: mock(
    async (
      _customerId: string,
    ): Promise<
      { status: string | null; total: number | null; at: Date | null }[]
    > => autoRuleStubs.orderRefs,
  ),
};

function findInList(row: AutoRuleRow): boolean {
  return autoRuleStubs.ruleRows.some((item) => item.rule_id === row.rule_id);
}

// Hook-suite seam: lifecycle services call these handlers, so their tests
// assert on the calls while the engine itself stays out of process.
export const autoGrantStubs = {
  calls: [] as { handler: string; args: unknown[] }[],
  throws: false,
};

function record(handler: string, args: unknown[]): void {
  autoGrantStubs.calls.push({ handler, args });
}

export const autoGrantServiceMocks = {
  handleVoucherSignup: mock(async (userId: string): Promise<void> => {
    record("handleVoucherSignup", [userId]);
    if (autoGrantStubs.throws) throw new Error("voucher boom");
  }),
  handleVoucherBookingCompleted: mock(
    async (userId: string, total: number): Promise<void> => {
      record("handleVoucherBookingCompleted", [userId, total]);
      if (autoGrantStubs.throws) throw new Error("voucher boom");
    },
  ),
  handleVoucherOrderDelivered: mock(
    async (userId: string, orderId: string, total: number): Promise<void> => {
      record("handleVoucherOrderDelivered", [userId, orderId, total]);
      if (autoGrantStubs.throws) throw new Error("voucher boom");
    },
  ),
  handleVoucherOrderRefunded: mock(
    async (userId: string, total: number): Promise<void> => {
      record("handleVoucherOrderRefunded", [userId, total]);
      if (autoGrantStubs.throws) throw new Error("voucher boom");
    },
  ),
  handleVoucherReviewCreated: mock(
    async (userId: string, reviewRefId: string): Promise<void> => {
      record("handleVoucherReviewCreated", [userId, reviewRefId]);
      if (autoGrantStubs.throws) throw new Error("voucher boom");
    },
  ),
  // The orders pipeline calls the one-line transition shim rather than
  // the granular handlers, so the mock records (row, status) pairs.
  handleVoucherOrderTransition: mock(
    async (
      row: {
        customer_id: string | null;
        order_id: string;
        total: number | null;
      },
      nextStatus: string,
    ): Promise<void> => {
      record("handleVoucherOrderTransition", [row, nextStatus]);
      if (autoGrantStubs.throws) throw new Error("voucher boom");
    },
  ),
  runVoucherWinBackScan: mock(
    async (_now?: Date): Promise<WinBackScanResult> => ({
      scannedCustomers: 0,
      granted: 0,
    }),
  ),
};

// Route-suite seam: the dispatch voucher-rules routes only depend on the
// auth guard and this service surface.
export const autoRuleRouteStubs = {
  listResult: null as AutoRuleResult<VoucherAutoRule[]> | null,
  createResult: null as AutoRuleResult<VoucherAutoRule> | null,
  toggleResult: null as AutoRuleResult<VoucherAutoRule> | null,
  nearResult: null as AutoRuleResult<NearMilestonePage> | null,
};

export const autoRuleServiceMocks = {
  listAutoRules: mock(
    async (): Promise<AutoRuleResult<VoucherAutoRule[]>> =>
      autoRuleRouteStubs.listResult ?? { ok: true, data: [] },
  ),
  createAutoRule: mock(
    async (
      _actor: { id: string; role: string },
      _input: unknown,
    ): Promise<AutoRuleResult<VoucherAutoRule>> =>
      autoRuleRouteStubs.createResult ?? {
        ok: false,
        status: 400,
        errors: { form: "unset" },
      },
  ),
  toggleAutoRule: mock(
    async (
      _actor: { id: string; role: string },
      _ruleId: string,
      _isActive: boolean,
    ): Promise<AutoRuleResult<VoucherAutoRule>> =>
      autoRuleRouteStubs.toggleResult ?? {
        ok: false,
        status: 400,
        errors: { form: "unset" },
      },
  ),
  listNearMilestones: mock(
    async (): Promise<AutoRuleResult<NearMilestonePage>> =>
      autoRuleRouteStubs.nearResult ?? {
        ok: true,
        data: { entries: [], scannedCustomers: 0, truncated: false },
      },
  ),
};

export function resetAutoRuleMocks(): void {
  autoRuleStubs.ruleRows = [];
  autoRuleStubs.ruleById = null;
  autoRuleStubs.statsByCustomer = new Map();
  autoRuleStubs.statsScanRows = [];
  autoRuleStubs.dedupeLedger = new Map();
  autoRuleStubs.releasedDedupe = [];
  autoRuleStubs.insertedRules = [];
  autoRuleStubs.setActiveCalls = [];
  autoRuleStubs.grantCountBumps = [];
  autoRuleStubs.statsCasPlan = [];
  autoRuleStubs.statsInsertLoses = 0;
  autoRuleStubs.statsPeerRow = null;
  autoRuleStubs.bookingRefs = [];
  autoRuleStubs.orderRefs = [];
  autoGrantStubs.calls = [];
  autoGrantStubs.throws = false;
  autoRuleRouteStubs.listResult = null;
  autoRuleRouteStubs.createResult = null;
  autoRuleRouteStubs.toggleResult = null;
  autoRuleRouteStubs.nearResult = null;
  for (const fn of Object.values(autoRuleRepoMocks)) fn.mockClear();
  for (const fn of Object.values(autoGrantServiceMocks)) fn.mockClear();
  for (const fn of Object.values(autoRuleServiceMocks)) fn.mockClear();
}
