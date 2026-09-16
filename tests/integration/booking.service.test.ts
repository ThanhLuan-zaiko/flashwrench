import { beforeEach, describe, expect, mock, test } from "bun:test";
import { makePublicUser } from "../helpers/auth.fixtures";
import { makeBookingInput } from "../helpers/booking.fixtures";
import { makeServiceRow } from "../helpers/catalog.fixtures";
import {
  bookingRepoMocks,
  bookingStubs,
  catalogServiceRepoMocks,
  catalogStubs,
  resetServiceMocks,
} from "../helpers/service-mocks";

// Helpers first, mocks second, system under test last: bun hoists
// mock.module above imports. The booking service only reads the catalog
// (price snapshot) and writes one batch, both stubbed here.
mock.module("@/lib/booking/booking.repository", () => bookingRepoMocks);
mock.module("@/lib/catalog/services.repository", () => catalogServiceRepoMocks);

import { createCustomerBooking } from "@/lib/booking/booking.service";

beforeEach(() => {
  resetServiceMocks();
  catalogStubs.serviceById = makeServiceRow();
});

describe("createCustomerBooking", () => {
  test("snapshots the catalog price and writes one atomic batch", async () => {
    const customer = makePublicUser();
    const result = await createCustomerBooking(customer, makeBookingInput());

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data).toMatchObject({
      status: "pending",
      serviceName: "Thay dau dong co",
      total: 199000,
      vehiclePlate: "51F-12345",
    });
    expect(bookingStubs.inserts).toHaveLength(1);
    expect(bookingStubs.inserts[0]).toMatchObject({
      customerId: customer.id,
      customerName: customer.fullName,
      status: "pending",
      paymentStatus: "unpaid",
      subtotal: 199000,
      total: 199000,
      serviceName: "Thay dau dong co",
      unitPrice: 199000,
    });
  });

  test("rejects invalid input with 400 without touching storage", async () => {
    const result = await createCustomerBooking(
      makePublicUser(),
      makeBookingInput({ address: "Q3" }),
    );

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.status).toBe(400);
    expect(result.errors.address).toContain("10 đến 300");
    expect(bookingStubs.inserts).toHaveLength(0);
    expect(catalogServiceRepoMocks.findServiceRowById.mock.calls.length).toBe(
      0,
    );
  });

  test("returns 404 for missing, inactive and deleted services", async () => {
    catalogStubs.serviceById = null;
    const missing = await createCustomerBooking(
      makePublicUser(),
      makeBookingInput(),
    );
    expect(missing.ok).toBe(false);
    if (missing.ok) return;
    expect(missing.status).toBe(404);

    catalogStubs.serviceById = makeServiceRow({ is_active: false });
    const inactive = await createCustomerBooking(
      makePublicUser(),
      makeBookingInput(),
    );
    expect(inactive.ok).toBe(false);
    if (inactive.ok) return;
    expect(inactive.status).toBe(404);

    catalogStubs.serviceById = makeServiceRow({ is_deleted: true });
    const deleted = await createCustomerBooking(
      makePublicUser(),
      makeBookingInput(),
    );
    expect(deleted.ok).toBe(false);
    if (deleted.ok) return;
    expect(deleted.status).toBe(404);

    expect(bookingStubs.inserts).toHaveLength(0);
  });
});
