import { beforeEach, describe, expect, mock, test } from "bun:test";
import type { PublicUser } from "@/lib/auth/user.types";
import type { RevenueReport } from "@/lib/revenue/revenue.types";
import { makePublicUser } from "../helpers/auth.fixtures";

// Mid-month midday keeps every derived day/month bucket far from edges.
const NOW = new Date("2026-09-15T10:00:00+07:00");

const stubs = {
  statusPages: {
    rows: [] as Array<{ booking_id: string; scheduled_at: Date | null }>,
    pageState: null as string | null,
  },
  mechanicRows: [] as Array<{ is_online: boolean | null }>,
  rescueCounts: new Map<string, number>(),
  revenueResult: {
    ok: true,
    data: { collected: 4_500_000, receipts: 9 },
  } as { ok: boolean; data?: Partial<RevenueReport>; status?: number },
  auditResult: {
    ok: true,
    data: { events: [] as Array<Record<string, unknown>>, label: "" },
  } as {
    ok: boolean;
    data?: { events: Array<Record<string, unknown>>; label: string };
    status?: number;
  },
};

const dispatchRepoMocks = {
  listStatusBookingRefs: mock(async () => stubs.statusPages),
};
const directoryRepoMocks = {
  listAvailableMechanicRows: mock(async () => stubs.mechanicRows),
};
const adminDashboardRepoMocks = {
  countRescueRefsByStatus: mock(
    async (status: string) => stubs.rescueCounts.get(status) ?? 0,
  ),
};
const revenueServiceMocks = {
  getAdminRevenue: mock(async () => stubs.revenueResult),
  getPaymentAudit: mock(async () => stubs.auditResult),
};

mock.module("@/lib/dispatch/dispatch.repository", () => dispatchRepoMocks);
mock.module(
  "@/lib/mechanic/mechanic-directory.repository",
  () => directoryRepoMocks,
);
mock.module(
  "@/lib/admin/admin-dashboard.repository",
  () => adminDashboardRepoMocks,
);
mock.module("@/lib/revenue/revenue.service", () => revenueServiceMocks);

import { getAdminDashboard } from "@/lib/admin/admin-dashboard.service";

const admin = makePublicUser({ role: "admin" });

function auditEvent(action: string, index = 0) {
  return {
    eventId: `evt-${index}`,
    at: NOW.toISOString(),
    actorId: "mech-1",
    action,
    refType: "booking",
    refId: "booking-1",
    paymentId: `pay-${index}`,
    amount: 500_000,
    method: "cod",
    detail: null,
  };
}

beforeEach(() => {
  stubs.statusPages = { rows: [], pageState: null };
  stubs.mechanicRows = [];
  stubs.rescueCounts = new Map();
  stubs.revenueResult = {
    ok: true,
    data: { collected: 4_500_000, receipts: 9 },
  };
  stubs.auditResult = { ok: true, data: { events: [], label: "" } };
  dispatchRepoMocks.listStatusBookingRefs.mockClear();
  directoryRepoMocks.listAvailableMechanicRows.mockClear();
  adminDashboardRepoMocks.countRescueRefsByStatus.mockClear();
});

describe("getAdminDashboard access", () => {
  test("rejects non-admin actors", async () => {
    for (const role of ["customer", "dispatcher", "mechanic"] as const) {
      const actor: PublicUser = makePublicUser({ role });
      const result = await getAdminDashboard(actor, NOW);
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.status).toBe(403);
    }
  });
});

describe("getAdminDashboard aggregation", () => {
  test("counts bookings scheduled today across status partitions", async () => {
    stubs.statusPages = {
      rows: [
        { booking_id: "b-1", scheduled_at: NOW },
        {
          booking_id: "b-2",
          scheduled_at: new Date("2026-09-13T10:00:00+07:00"),
        },
        { booking_id: "b-3", scheduled_at: null },
      ],
      pageState: null,
    };
    const result = await getAdminDashboard(admin, NOW);
    expect(result.ok).toBe(true);
    // Every status partition returns the same stubbed page; each of them
    // contributes its one today-row, so the total scales with statuses.
    if (result.ok) expect(result.data.todayBookings).toBe(8);
  });

  test("sums live rescue statuses and pending separately", async () => {
    stubs.rescueCounts = new Map([
      ["open", 3],
      ["dispatched", 2],
      ["accepted", 1],
      ["en_route", 1],
      ["arrived", 0],
    ]);
    const result = await getAdminDashboard(admin, NOW);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.openRescues).toBe(7);
      expect(result.data.pendingRescues).toBe(5);
    }
  });

  test("counts only mechanics flagged online", async () => {
    stubs.mechanicRows = [
      { is_online: true },
      { is_online: true },
      { is_online: false },
      { is_online: null },
    ];
    const result = await getAdminDashboard(admin, NOW);
    if (result.ok) expect(result.data.onlineMechanics).toBe(2);
  });

  test("passes through month revenue and counts audit actions", async () => {
    stubs.auditResult = {
      ok: true,
      data: {
        events: [
          auditEvent("recorded", 1),
          auditEvent("recorded", 2),
          auditEvent("confirm_failed", 3),
          auditEvent("confirm_code_issued", 4),
        ],
        label: "Ngày 15/09/2026",
      },
    };
    const result = await getAdminDashboard(admin, NOW);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.monthRevenue).toBe(4_500_000);
      expect(result.data.monthReceipts).toBe(9);
      expect(result.data.todayReceipts).toBe(2);
      expect(result.data.failedConfirmations).toBe(1);
      expect(result.data.events).toHaveLength(4);
    }
  });

  test("caps the activity feed at eight events", async () => {
    stubs.auditResult = {
      ok: true,
      data: {
        events: Array.from({ length: 12 }, (_, i) => auditEvent("recorded", i)),
        label: "",
      },
    };
    const result = await getAdminDashboard(admin, NOW);
    if (result.ok) expect(result.data.events).toHaveLength(8);
  });

  test("fails when the revenue report cannot load", async () => {
    stubs.revenueResult = { ok: false, status: 500 };
    const result = await getAdminDashboard(admin, NOW);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.status).toBe(500);
  });
});
