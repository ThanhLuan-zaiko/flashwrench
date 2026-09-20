import { beforeEach, describe, expect, mock, test } from "bun:test";
import { parseDomainEvent } from "@/lib/realtime/protocol";
import { makePublicUser, postJsonRequest } from "../helpers/auth.fixtures";
import {
  complaintServiceMocks,
  resetComplaintMocks,
} from "../helpers/complaint.mocks";
import {
  authorizationMocks,
  realtimePublishMocks,
  resetRouteMocks,
  routeStubs,
} from "../helpers/route-mocks";

mock.module("@/lib/auth/authorization", () => authorizationMocks);
mock.module("@/lib/complaints/complaints.service", () => complaintServiceMocks);
mock.module("@/lib/realtime/publish", () => realtimePublishMocks);

import { POST } from "@/app/api/admin/complaints/route";

beforeEach(() => {
  resetRouteMocks();
  resetComplaintMocks();
});

describe("POST /api/admin/complaints", () => {
  test("rejects non-admin roles before touching the service", async () => {
    routeStubs.bookingUser = makePublicUser({ role: "customer" });
    const res = await POST(postJsonRequest("/api/admin/complaints", {}));
    expect(res.status).toBe(403);
    expect(complaintServiceMocks.createComplaint.mock.calls.length).toBe(0);
    expect(realtimePublishMocks.publishRealtimeEvent.mock.calls.length).toBe(0);
  });

  test("publishes a complaint-updated event the parser accepts", async () => {
    routeStubs.bookingUser = makePublicUser({ role: "admin" });
    const res = await POST(
      postJsonRequest("/api/admin/complaints", {
        reporterName: "Nguyen Van A",
        subject: "Late",
        body: "Mechanic was late.",
      }),
    );
    expect(res.status).toBe(201);
    const call = realtimePublishMocks.publishRealtimeEvent.mock.calls[0];
    expect(call?.[0]).toBe("complaints");
    const parsed = parseDomainEvent(call?.[1]);
    expect(parsed).not.toBeNull();
    expect(parsed?.kind).toBe("complaint-updated");
  });
});
