import { beforeEach, describe, expect, mock, test } from "bun:test";
import { makePublicUser } from "../helpers/auth.fixtures";
import { makeComplaintRow } from "../helpers/complaint.fixtures";
import {
  complaintRepoMocks,
  complaintStubs,
  resetComplaintMocks,
} from "../helpers/complaint.mocks";
import { makeBookingRow } from "../helpers/mechanic.fixtures";
import {
  mechanicBookingsRepoMocks,
  mechanicStubs,
  resetMechanicMocks,
} from "../helpers/mechanic.mocks";
import {
  orderRepoMocks,
  orderStubs,
  resetPartsMocks,
} from "../helpers/parts.mocks";
import {
  makeRescueRow,
  rescueStubs,
  rescueWorkflowRepoMocks,
  resetRescueMocks,
} from "../helpers/rescue.mocks";

mock.module("@/lib/complaints/complaints.repository", () => complaintRepoMocks);
mock.module(
  "@/lib/mechanic/mechanic-bookings.repository",
  () => mechanicBookingsRepoMocks,
);
mock.module("@/lib/orders/orders.repository", () => orderRepoMocks);
mock.module(
  "@/lib/rescue/rescue-workflow.repository",
  () => rescueWorkflowRepoMocks,
);

import {
  createCustomerComplaint,
  listMyComplaints,
} from "@/lib/complaints/complaints.service";

const CUSTOMER_ID = "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee";
const BOOKING_ID = "11111111-1111-1111-1111-111111111111";
const OTHER_ID = "99999999-9999-4999-8999-999999999999";

const customer = makePublicUser({ id: CUSTOMER_ID, role: "customer" });

function complaintInput(overrides?: Record<string, unknown>) {
  return {
    refType: "other" as string,
    subject: "Tho den qua tre",
    body: "Tho hen 9 gio nhung 11 gio moi den, khong bao truoc.",
    ...overrides,
  };
}

beforeEach(() => {
  resetComplaintMocks();
  resetMechanicMocks();
  resetPartsMocks();
  resetRescueMocks();
  // The service re-reads the row it just inserted.
  complaintStubs.complaintById = makeComplaintRow({
    reporter_user_id: CUSTOMER_ID,
  });
});

describe("createCustomerComplaint", () => {
  test("files a complaint with session-derived reporter identity", async () => {
    const result = await createCustomerComplaint(customer, complaintInput());
    expect(result.ok).toBe(true);
    const write = complaintRepoMocks.insertComplaint.mock.calls[0]?.[0] as {
      reporterUserId: string | null;
      reporterName: string;
      reporterPhone: string;
    };
    expect(write.reporterUserId).toBe(CUSTOMER_ID);
    expect(write.reporterName).toBe(customer.fullName);
    expect(write.reporterPhone).toBe(customer.phone);
  });

  test("rejects invalid input without touching storage", async () => {
    for (const raw of [
      complaintInput({ subject: "" }),
      complaintInput({ subject: "ok subject", body: "short" }),
      complaintInput({ refType: "nonsense" }),
    ]) {
      expect(await createCustomerComplaint(customer, raw)).toMatchObject({
        ok: false,
        status: 400,
      });
    }
    expect(complaintRepoMocks.insertComplaint.mock.calls.length).toBe(0);
  });

  test("refs to owned bookings/orders/rescues pass the ownership gate", async () => {
    mechanicStubs.bookingById = makeBookingRow({ customer_id: CUSTOMER_ID });
    const result = await createCustomerComplaint(
      customer,
      complaintInput({ refType: "booking", refId: BOOKING_ID }),
    );
    expect(result.ok).toBe(true);
    const write = complaintRepoMocks.insertComplaint.mock.calls[0]?.[0] as {
      refType: string;
      refId: string;
    };
    expect(write.refType).toBe("booking");
    expect(write.refId).toBe(BOOKING_ID);
  });

  test("refs to foreign or missing entities read as 404", async () => {
    mechanicStubs.bookingById = makeBookingRow({ customer_id: OTHER_ID });
    expect(
      await createCustomerComplaint(
        customer,
        complaintInput({ refType: "booking", refId: BOOKING_ID }),
      ),
    ).toMatchObject({ ok: false, status: 404 });

    orderStubs.orderById = null;
    expect(
      await createCustomerComplaint(
        customer,
        complaintInput({
          refType: "order",
          refId: "ffffffff-ffff-4fff-8fff-ffffffffffff",
        }),
      ),
    ).toMatchObject({ ok: false, status: 404 });

    rescueStubs.rowById = makeRescueRow({ customer_id: OTHER_ID });
    expect(
      await createCustomerComplaint(
        customer,
        complaintInput({
          refType: "emergency",
          refId: "abababab-abab-4bab-8bab-abababababab",
        }),
      ),
    ).toMatchObject({ ok: false, status: 404 });
    expect(complaintRepoMocks.insertComplaint.mock.calls.length).toBe(0);
  });

  test("refs to transactional entities require a valid uuid", async () => {
    const result = await createCustomerComplaint(
      customer,
      complaintInput({ refType: "booking", refId: "booking-123" }),
    );
    expect(result).toMatchObject({ ok: false, status: 400 });
    expect(complaintRepoMocks.insertComplaint.mock.calls.length).toBe(0);
  });
});

describe("listMyComplaints", () => {
  test("returns the caller's complaints newest-first", async () => {
    complaintStubs.complaintRowsByUser = [
      makeComplaintRow({ subject: "First" }),
      makeComplaintRow({ subject: "Second" }),
    ];
    const result = await listMyComplaints(CUSTOMER_ID);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data).toHaveLength(2);
    expect(complaintRepoMocks.listComplaintRowsByUser.mock.calls[0]?.[0]).toBe(
      CUSTOMER_ID,
    );
  });

  test("rejects malformed user ids", async () => {
    expect(await listMyComplaints("nope")).toMatchObject({
      ok: false,
      status: 400,
    });
    expect(complaintRepoMocks.listComplaintRowsByUser.mock.calls.length).toBe(
      0,
    );
  });
});
