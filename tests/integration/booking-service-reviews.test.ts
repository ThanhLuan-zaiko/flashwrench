import { beforeEach, describe, expect, mock, test } from "bun:test";
import { makePublicUser } from "../helpers/auth.fixtures";
import {
  BOOKING_ID,
  CUSTOMER_ID,
  makeBookingItemRow,
  makeBookingRow,
} from "../helpers/mechanic.fixtures";
import {
  mechanicBookingsRepoMocks,
  mechanicStubs,
  resetMechanicMocks,
} from "../helpers/mechanic.mocks";
import {
  domainPublishMocks,
  makeReviewBookingRow,
  resetWorkspaceMocks,
  reviewRepoMocks,
  workspaceStubs,
} from "../helpers/workspace.mocks";

// Service part of the booking review: the optional second rating for the
// booked service(s). Mechanic-only behavior lives in booking-reviews.test.ts.
mock.module(
  "@/lib/mechanic/mechanic-bookings.repository",
  () => mechanicBookingsRepoMocks,
);
mock.module("@/lib/booking/review.repository", () => reviewRepoMocks);
mock.module("@/lib/realtime/domain-publish", () => domainPublishMocks);

import { createBookingReview } from "@/lib/booking/review.service";

const customer = makePublicUser({ id: CUSTOMER_ID, role: "customer" });
const SERVICE_ID = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const SECOND_SERVICE_ID = "cccccccc-2222-4222-8222-cccccccccccc";

function reviewBody(overrides?: Record<string, unknown>) {
  return { rating: 5, body: "Tho den dung gio.", ...overrides };
}

function twoPartBody(overrides?: Record<string, unknown>) {
  return reviewBody({
    serviceRating: 4,
    serviceBody: "Dich vu ky luong.",
    ...overrides,
  });
}

beforeEach(() => {
  resetMechanicMocks();
  resetWorkspaceMocks();
  mechanicStubs.bookingById = makeBookingRow({ status: "completed" });
  mechanicStubs.itemRows = [makeBookingItemRow({ service_id: SERVICE_ID })];
});

describe("createBookingReview service part validation", () => {
  test("rejects a service rating outside 1-5 or a non-numeric one", async () => {
    for (const serviceRating of [0, 6, 2.5, "five", true, []]) {
      const result = await createBookingReview(
        customer,
        BOOKING_ID,
        twoPartBody({ serviceRating }),
      );
      expect(result).toMatchObject({
        ok: false,
        status: 400,
        errors: { serviceRating: expect.any(String) },
      });
    }
    expect(reviewRepoMocks.claimBookingReview.mock.calls.length).toBe(0);
  });

  test("rejects overlong or non-string service notes", async () => {
    for (const serviceBody of ["x".repeat(1001), 42, {}]) {
      const result = await createBookingReview(
        customer,
        BOOKING_ID,
        twoPartBody({ serviceBody }),
      );
      expect(result).toMatchObject({
        ok: false,
        status: 400,
        errors: { serviceBody: expect.any(String) },
      });
    }
    expect(reviewRepoMocks.claimBookingReview.mock.calls.length).toBe(0);
  });

  test("a service note without a service rating is rejected", async () => {
    const result = await createBookingReview(
      customer,
      BOOKING_ID,
      reviewBody({ serviceBody: "Chi co ghi chu." }),
    );
    expect(result).toMatchObject({
      ok: false,
      status: 400,
      errors: { serviceRating: expect.any(String) },
    });
    expect(reviewRepoMocks.claimBookingReview.mock.calls.length).toBe(0);
  });

  test("reports mechanic and service errors together", async () => {
    const result = await createBookingReview(
      customer,
      BOOKING_ID,
      twoPartBody({ rating: 0, serviceRating: 9 }),
    );
    expect(result).toMatchObject({
      ok: false,
      status: 400,
      errors: {
        rating: expect.any(String),
        serviceRating: expect.any(String),
      },
    });
  });

  test("a booking without services cannot take a service rating", async () => {
    mechanicStubs.itemRows = [];
    const result = await createBookingReview(
      customer,
      BOOKING_ID,
      twoPartBody(),
    );
    expect(result).toMatchObject({ ok: false, status: 400 });
    expect(reviewRepoMocks.claimBookingReview.mock.calls.length).toBe(0);
  });
});

describe("createBookingReview service part writes", () => {
  test("stores both parts and projects one row per booked service", async () => {
    mechanicStubs.itemRows = [
      makeBookingItemRow({ service_id: SERVICE_ID }),
      makeBookingItemRow({ service_id: SECOND_SERVICE_ID }),
      makeBookingItemRow({ service_id: SERVICE_ID }),
    ];
    const result = await createBookingReview(
      customer,
      BOOKING_ID,
      twoPartBody(),
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data).toMatchObject({
      rating: 5,
      body: "Tho den dung gio.",
      serviceRating: 4,
      serviceBody: "Dich vu ky luong.",
    });
    const claim = reviewRepoMocks.claimBookingReview.mock.calls[0]?.[0];
    expect(claim).toMatchObject({ serviceRating: 4 });
    expect(workspaceStubs.reviewWrites[0]?.serviceIds).toEqual([
      SERVICE_ID,
      SECOND_SERVICE_ID,
    ]);
    expect(domainPublishMocks.publishBookingChange.mock.calls.length).toBe(1);
  });

  test("trims notes and accepts a numeric-string service rating", async () => {
    const result = await createBookingReview(
      customer,
      BOOKING_ID,
      twoPartBody({ serviceRating: "3", serviceBody: "  Tot  " }),
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.serviceRating).toBe(3);
    expect(result.data.serviceBody).toBe("Tot");
  });

  test("a same retry repairs the service projection from stored fields", async () => {
    workspaceStubs.reviewClaimed = false;
    workspaceStubs.reviewByBooking = makeReviewBookingRow({
      service_rating: 4,
      service_body: "Dich vu ky luong.",
    });
    workspaceStubs.reviewReadQueue = [null, workspaceStubs.reviewByBooking];
    const result = await createBookingReview(
      customer,
      BOOKING_ID,
      twoPartBody(),
    );
    expect(result.ok).toBe(true);
    expect(workspaceStubs.reviewWrites[0]).toMatchObject({
      serviceRating: 4,
      serviceBody: "Dich vu ky luong.",
      serviceIds: [SERVICE_ID],
    });
  });

  test("a retry with a different service part is a conflict", async () => {
    workspaceStubs.reviewByBooking = makeReviewBookingRow({
      service_rating: 4,
      service_body: "Dich vu ky luong.",
    });
    for (const changed of [
      twoPartBody({ serviceRating: 2 }),
      twoPartBody({ serviceBody: "Noi dung khac." }),
      reviewBody(),
    ]) {
      const result = await createBookingReview(customer, BOOKING_ID, changed);
      expect(result).toMatchObject({ ok: false, status: 409 });
    }
    expect(reviewRepoMocks.claimBookingReview.mock.calls.length).toBe(0);
    expect(reviewRepoMocks.projectBookingReview.mock.calls.length).toBe(0);
  });

  test("a legacy mechanic-only review cannot gain a service part later", async () => {
    workspaceStubs.reviewByBooking = makeReviewBookingRow();
    const result = await createBookingReview(
      customer,
      BOOKING_ID,
      twoPartBody(),
    );
    expect(result).toMatchObject({ ok: false, status: 409 });
    expect(reviewRepoMocks.projectBookingReview.mock.calls.length).toBe(0);
  });
});
