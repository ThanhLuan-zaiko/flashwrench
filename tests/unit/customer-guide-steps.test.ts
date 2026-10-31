// Customer guide contract: every anchor exists in the page source, routes are
// derived across pages, booking steps name the phone wizard step that shows
// them, and the Q&A steps mirror the visible FAQ one for one.
import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  CUSTOMER_GUIDE_NAME,
  CUSTOMER_GUIDE_STEPS,
  VOUCHERS_GUIDE_NAME,
} from "@/components/tour/customer-guide.steps";
import { adaptTours } from "@/components/tour/tour-adapt";
import { VOUCHER_FAQ } from "@/components/vouchers/voucher-faq.content";

const ROOT = join(import.meta.dir, "..", "..");

// The file that renders each static anchor.
const ANCHOR_SOURCES: Record<string, string> = {
  "guide-services": "components/services/ServicesLanding.tsx",
  "booking-services": "components/booking/BookingServiceSection.tsx",
  "booking-details": "components/booking/BookingWhereWhenStep.tsx",
  "booking-vehicle": "components/booking/BookingDetailsSection.tsx",
  "booking-summary": "components/booking/BookingPriceSummary.tsx",
  "vouchers-header": "components/vouchers/VouchersList.tsx",
  "vouchers-campaigns": "components/vouchers/VouchersList.tsx",
};

// FAQ anchors are built from an index, so they are checked by prefix.
const FAQ_ANCHOR = /^vouchers-faq-\d+$/;

type Hinted = { wizardStep?: number; nextRoute?: string; prevRoute?: string };

function anchorOf(selector: string | undefined): string {
  return /data-tour="([^"]+)"/.exec(selector ?? "")?.[1] ?? "";
}

function stepsOf(name: string) {
  const tour = adaptTours(CUSTOMER_GUIDE_STEPS).find(
    (candidate) => candidate.tour === name,
  );
  return tour?.steps ?? [];
}

const customer = stepsOf(CUSTOMER_GUIDE_NAME);
const vouchers = stepsOf(VOUCHERS_GUIDE_NAME);

function hinted(step: unknown): Hinted {
  return step as Hinted;
}

describe("customer guide", () => {
  test("two named tours share the root provider", () => {
    expect(adaptTours(CUSTOMER_GUIDE_STEPS).map((tour) => tour.tour)).toEqual([
      CUSTOMER_GUIDE_NAME,
      VOUCHERS_GUIDE_NAME,
    ]);
  });

  test("every static anchor exists in the page that renders it", () => {
    for (const step of [...customer, ...vouchers]) {
      const anchor = anchorOf(step.selector);
      if (FAQ_ANCHOR.test(anchor)) continue;
      const source = ANCHOR_SOURCES[anchor];
      expect(source).toBeDefined();
      const text = readFileSync(join(ROOT, source ?? ""), "utf8");
      expect(
        text.includes(`data-tour="${anchor}"`) ||
          text.includes(`tour="${anchor}"`),
      ).toBe(true);
    }
  });

  test("the booking-wizard anchor exists on the phone bar", () => {
    const text = readFileSync(
      join(ROOT, "components/booking/BookingWizardNav.tsx"),
      "utf8",
    );
    expect(text).toContain('data-tour="booking-wizard"');
  });

  test("the FAQ anchors are rendered by the FAQ component", () => {
    const text = readFileSync(
      join(ROOT, "components/vouchers/VouchersFaq.tsx"),
      "utf8",
    );
    expect(text).toContain("data-tour={`vouchers-faq-${index}`}");
  });

  test("each booking step names the wizard step that shows its section", () => {
    const byAnchor = (anchor: string) =>
      hinted(customer.find((step) => anchorOf(step.selector) === anchor));
    expect(byAnchor("booking-services").wizardStep).toBe(0);
    expect(byAnchor("booking-details").wizardStep).toBe(1);
    expect(byAnchor("booking-vehicle").wizardStep).toBe(3);
    expect(byAnchor("booking-summary").wizardStep).toBe(3);
  });

  test("the vehicle step is part of the guide on every layout", () => {
    const anchors = customer.map((step) => anchorOf(step.selector));
    expect(anchors).toContain("booking-vehicle");
    expect(anchors.indexOf("booking-vehicle")).toBeGreaterThan(
      anchors.indexOf("booking-details"),
    );
  });

  test("routes follow the page changes", () => {
    expect(hinted(customer[0]).nextRoute).toBe("/booking");
    const handover = customer.find(
      (step) => anchorOf(step.selector) === "vouchers-header",
    );
    expect(hinted(handover).prevRoute).toBe("/booking");
    const services = customer.find(
      (step) => anchorOf(step.selector) === "booking-services",
    );
    expect(hinted(services).nextRoute).toBeUndefined();
    expect(hinted(services).prevRoute).toBe("/services");
    const lastBooking = customer.find(
      (step) => anchorOf(step.selector) === "booking-summary",
    );
    expect(hinted(lastBooking).nextRoute).toBe("/vouchers");
  });

  test("the vouchers guide answers every FAQ question once", () => {
    const faqSteps = vouchers.filter((step) =>
      FAQ_ANCHOR.test(anchorOf(step.selector)),
    );
    expect(faqSteps).toHaveLength(VOUCHER_FAQ.length);
    faqSteps.forEach((step, index) => {
      expect(anchorOf(step.selector)).toBe(`vouchers-faq-${index}`);
      expect(step.content).toBe(VOUCHER_FAQ[index]?.answer);
    });
  });

  test("the partial-value answer says the leftover is kept", () => {
    const answer = VOUCHER_FAQ[0]?.answer ?? "";
    expect(answer).toContain("300.000đ");
    expect(answer).toContain("tự áp cho đơn sau");
  });

  test("step numbers run in order", () => {
    customer.forEach((step, index) => {
      expect(step.title.startsWith(`Bước ${index + 1} · `)).toBe(true);
    });
  });

  test("copy is Vietnamese and anchors are unique within each guide", () => {
    for (const steps of [customer, vouchers]) {
      const anchors = steps.map((step) => anchorOf(step.selector));
      expect(new Set(anchors).size).toBe(anchors.length);
      for (const step of steps) {
        expect(step.content).toMatch(
          /[ạảãáàấầẩẫậắằẳẵặẹẻẽéèếềểễệỉĩíịọỏõóòốồổỗộớờởỡợụủũúùứừửữựỳỷỹýỵđ]/i,
        );
      }
    }
  });
});
