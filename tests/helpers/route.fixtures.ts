import type { AccountSession, AccountStatus } from "@/lib/auth/account-status";
import type { AuthResult } from "@/lib/auth/user.types";
import type { CreatedBooking } from "@/lib/booking/booking.types";
import type { MechanicDirectoryItem } from "@/lib/mechanic/mechanic-directory.service";
import { makePublicUser, makeSessionTokens } from "./auth.fixtures";

export function okAuthResult(): AuthResult {
  return {
    ok: true,
    user: makePublicUser(),
    tokens: makeSessionTokens(),
  };
}

export function okRefreshOutcome() {
  const tokens = makeSessionTokens();
  return { ok: true as const, user: makePublicUser(), tokens };
}

export function okAccountSession(
  overrides?: Partial<AccountSession>,
): AccountSession {
  return {
    user: makePublicUser(),
    status: "active" as AccountStatus,
    ...overrides,
  };
}

export function okCreatedBooking(): CreatedBooking {
  return {
    bookingId: "99999999-9999-4999-8999-999999999999",
    status: "pending",
    scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    timezone: "Asia/Ho_Chi_Minh",
    total: 199000,
    serviceId: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
    serviceName: "Thay dau dong co",
    vehiclePlate: "51F-12345",
    address: "123 Nguyen Trai, Phuong 5, Quan 3, TP Ho Chi Minh",
    lat: 10.7769,
    lng: 106.7009,
    mechanicId: null,
    mechanicName: null,
  };
}

export function okMechanicDirectoryItem(): MechanicDirectoryItem {
  return {
    id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
    displayName: "Nguyen Van A",
    skills: ["engine", "tire"],
    ratingAvg: 4.8,
    ratingCount: 12,
    completedJobs: 30,
    isOnline: true,
    distanceKm: 1.2,
    lat: 10.775,
    lng: 106.7,
  };
}
