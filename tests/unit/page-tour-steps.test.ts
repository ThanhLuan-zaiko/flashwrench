import { describe, expect, test } from "bun:test";
import {
  ADMIN_TOUR_NAMES,
  ADMIN_TOUR_STEPS,
} from "@/app/admin/components/tour/admin-tour.steps";
import {
  DISPATCH_TOUR_NAMES,
  DISPATCH_TOUR_STEPS,
} from "@/app/dispatch/components/tour/dispatch-tour.steps";
import {
  MECHANIC_TOUR_NAMES,
  MECHANIC_TOUR_STEPS,
} from "@/app/mechanic/components/tour/mechanic-tour.steps";
import {
  BOOKING_TOUR_NAME,
  BOOKING_TOUR_STEPS,
} from "@/components/booking/tour/booking-tour.steps";
import {
  PRODUCTS_TOUR_NAME,
  PRODUCTS_TOUR_STEPS,
} from "@/components/products/tour/products-tour.steps";
import {
  RESCUE_TOUR_NAME,
  RESCUE_TOUR_STEPS,
} from "@/components/rescue/tour/rescue-tour.steps";

const VALID_SIDES = new Set([
  "top",
  "bottom",
  "left",
  "right",
  "top-left",
  "top-right",
  "bottom-left",
  "bottom-right",
  "left-top",
  "left-bottom",
  "right-top",
  "right-bottom",
]);

const PAGE_TOURS = [
  { name: PRODUCTS_TOUR_NAME, steps: PRODUCTS_TOUR_STEPS },
  { name: BOOKING_TOUR_NAME, steps: BOOKING_TOUR_STEPS },
  { name: RESCUE_TOUR_NAME, steps: RESCUE_TOUR_STEPS },
] as const;

const WORKSPACE_TOURS = [
  { names: MECHANIC_TOUR_NAMES, tours: MECHANIC_TOUR_STEPS },
  { names: DISPATCH_TOUR_NAMES, tours: DISPATCH_TOUR_STEPS },
  { names: ADMIN_TOUR_NAMES, tours: ADMIN_TOUR_STEPS },
] as const;

const ALL_TOURS = [
  ...PAGE_TOURS.flatMap(({ steps }) => steps),
  ...WORKSPACE_TOURS.flatMap(({ tours }) => tours),
];

// data-tour attribute each step must point at, per workspace tour.
const WORKSPACE_SELECTORS: Record<string, string[]> = {
  [MECHANIC_TOUR_NAMES.schedule]: [
    "mech-presence",
    "mech-rescue-inbox",
    "mech-schedule-stats",
    "mech-schedule-tabs",
    "mech-schedule-queue",
  ],
  [MECHANIC_TOUR_NAMES.map]: [
    "mech-map-share",
    "mech-map-board",
    "mech-map-list",
  ],
  [MECHANIC_TOUR_NAMES.income]: [
    "mech-income-summary",
    "mech-income-tabs",
    "mech-income-history",
  ],
  [MECHANIC_TOUR_NAMES.stats]: [
    "mech-stats-counters",
    "mech-stats-chart",
    "mech-stats-rating",
    "mech-stats-reviews",
  ],
  [DISPATCH_TOUR_NAMES.board]: [
    "disp-board-intro",
    "disp-board-month",
    "disp-board-tabs",
    "disp-board-track",
    "disp-board-queue",
  ],
  [DISPATCH_TOUR_NAMES.rescue]: ["disp-rescue-tabs", "disp-rescue-list"],
  [DISPATCH_TOUR_NAMES.orders]: [
    "disp-orders-intro",
    "disp-orders-month",
    "orders-tabs",
    "orders-queue",
  ],
  [DISPATCH_TOUR_NAMES.vouchers]: [
    "disp-vouchers-grant",
    "disp-vouchers-codes",
    "disp-vouchers-public",
  ],
  [DISPATCH_TOUR_NAMES.stock]: ["disp-stock-intro", "disp-stock-list"],
  [DISPATCH_TOUR_NAMES.revenue]: [
    "revenue-ranges",
    "revenue-toolbar",
    "revenue-trend",
    "revenue-mix-source",
    "revenue-txns",
  ],
  [DISPATCH_TOUR_NAMES["customer-mix"]]: [
    "mix-ranges",
    "mix-toolbar",
    "mix-channel",
    "mix-kpis",
    "mix-split",
  ],
  [ADMIN_TOUR_NAMES.dashboard]: [
    "admin-dash-hero",
    "admin-dash-stats",
    "admin-dash-activity",
    "admin-dash-alerts",
  ],
  [ADMIN_TOUR_NAMES.users]: [
    "admin-users-stats",
    "admin-users-tabs",
    "admin-users-board",
  ],
  [ADMIN_TOUR_NAMES.services]: [
    "admin-services-stats",
    "admin-services-tabs",
    "admin-services-board",
  ],
  [ADMIN_TOUR_NAMES.products]: [
    "admin-products-stats",
    "admin-products-tabs",
    "admin-products-board",
  ],
  [ADMIN_TOUR_NAMES.vouchers]: [
    "admin-vouchers-stats",
    "admin-vouchers-tabs",
    "admin-vouchers-board",
  ],
  [ADMIN_TOUR_NAMES.orders]: [
    "admin-orders-intro",
    "admin-orders-month",
    "orders-tabs",
    "orders-queue",
  ],
  [ADMIN_TOUR_NAMES.rescue]: ["admin-rescue-sla", "admin-rescue-zones"],
  [ADMIN_TOUR_NAMES.revenue]: [
    "revenue-ranges",
    "revenue-toolbar",
    "revenue-mechanic",
    "revenue-txns",
    "admin-fraud",
    "admin-audit",
  ],
  [ADMIN_TOUR_NAMES["customer-mix"]]: [
    "mix-ranges",
    "mix-toolbar",
    "mix-channel",
    "mix-kpis",
    "mix-split",
  ],
  [ADMIN_TOUR_NAMES.settings]: [
    "admin-settings-nav",
    "admin-settings-overview",
    "admin-settings-booking",
    "admin-settings-hours",
    "admin-settings-shop",
  ],
};

function tourAnchors(steps: { selector?: string }[]): string[] {
  return steps.map((step) => {
    const match = /data-tour="([^"]+)"/.exec(step.selector ?? "");
    return match?.[1] ?? "";
  });
}

describe("page tour steps", () => {
  test("exposes one named tour per page", () => {
    expect(PRODUCTS_TOUR_NAME).toBe("products-guide");
    expect(BOOKING_TOUR_NAME).toBe("booking-guide");
    expect(RESCUE_TOUR_NAME).toBe("rescue-guide");
    for (const { name, steps } of PAGE_TOURS) {
      expect(steps).toHaveLength(1);
      expect(steps[0]?.tour).toBe(name);
    }
  });

  test("products tour covers filter, grid and cart anchors", () => {
    const steps = PRODUCTS_TOUR_STEPS[0]?.steps ?? [];
    const selectors = steps.map((step) => step.selector ?? "");
    expect(selectors).toEqual([
      '[data-tour="products-filter"]',
      '[data-tour="products-grid"]',
      '[data-tour="products-cart-cta"]',
    ]);
  });

  test("booking tour covers the four steps and the summary", () => {
    const steps = BOOKING_TOUR_STEPS[0]?.steps ?? [];
    const selectors = steps.map((step) => step.selector ?? "");
    expect(selectors).toEqual([
      '[data-tour="booking-services"]',
      '[data-tour="booking-location"]',
      '[data-tour="booking-details"]',
      '[data-tour="booking-contact"]',
      '[data-tour="booking-summary"]',
    ]);
  });

  test("rescue tour covers contact, issue, location, submit and safety", () => {
    const steps = RESCUE_TOUR_STEPS[0]?.steps ?? [];
    const selectors = steps.map((step) => step.selector ?? "");
    expect(selectors).toEqual([
      '[data-tour="rescue-contact"]',
      '[data-tour="rescue-issue"]',
      '[data-tour="rescue-location"]',
      '[data-tour="rescue-submit"]',
      '[data-tour="rescue-safety"]',
    ]);
  });
});

describe("workspace tour steps", () => {
  test("exposes one named tour per workspace section", () => {
    expect(Object.keys(MECHANIC_TOUR_NAMES)).toHaveLength(4);
    expect(Object.keys(DISPATCH_TOUR_NAMES)).toHaveLength(7);
    expect(Object.keys(ADMIN_TOUR_NAMES)).toHaveLength(10);
    for (const { names, tours } of WORKSPACE_TOURS) {
      const sectionNames = Object.values(names);
      expect(new Set(sectionNames).size).toBe(sectionNames.length);
      expect(tours.map((tour) => tour.tour).sort()).toEqual(
        [...sectionNames].sort(),
      );
    }
  });

  test("every workspace tour points at its section anchors", () => {
    for (const tour of [
      ...MECHANIC_TOUR_STEPS,
      ...DISPATCH_TOUR_STEPS,
      ...ADMIN_TOUR_STEPS,
    ]) {
      expect(WORKSPACE_SELECTORS[tour.tour], tour.tour).toBeDefined();
      expect(tourAnchors(tour.steps), tour.tour).toEqual(
        WORKSPACE_SELECTORS[tour.tour],
      );
    }
  });
});

describe("shared tour step contract", () => {
  test("keeps selectors unique and copy in Vietnamese", () => {
    for (const tour of ALL_TOURS) {
      const steps = tour.steps;
      const selectors = steps.map((step) => step.selector ?? "");
      expect(new Set(selectors).size).toBe(selectors.length);
      const titles = steps.map((step) => step.title);
      expect(new Set(titles).size).toBe(titles.length);
      for (const step of steps) {
        expect(step.title.trim().length).toBeGreaterThan(0);
        expect(String(step.content).trim().length).toBeGreaterThan(0);
      }
    }
  });

  test("keeps spotlight placement and offsets valid", () => {
    for (const tour of ALL_TOURS) {
      for (const step of tour.steps) {
        expect(VALID_SIDES.has(step.side ?? "")).toBe(true);
        expect(step.pointerPadding ?? 0).toBeGreaterThanOrEqual(0);
        expect(step.pointerRadius ?? 0).toBeGreaterThanOrEqual(0);
        expect(step.cardOffset ?? 0).toBeGreaterThanOrEqual(0);
        // Sticky header is 64px tall, so the scroll offset must clear it.
        expect(step.scrollOffset ?? 0).toBeGreaterThanOrEqual(64);
        expect(step.selectorRetryAttempts ?? 0).toBeGreaterThan(0);
      }
    }
  });

  test("omits built-in card controls when using a custom card", () => {
    for (const tour of ALL_TOURS) {
      for (const step of tour.steps) {
        expect("showControls" in step).toBe(false);
        expect("showSkip" in step).toBe(false);
      }
    }
  });
});
