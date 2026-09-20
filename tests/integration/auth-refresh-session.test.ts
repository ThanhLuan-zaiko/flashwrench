import { afterAll, beforeEach, describe, expect, mock, test } from "bun:test";

const reconnectMock = mock(() => {});

mock.module("@/lib/realtime/realtime-client", () => ({
  reconnectRealtime: reconnectMock,
}));

import {
  AuthApiError,
  apiRequest,
  loginRequest,
  logoutAllRequest,
  logoutRequest,
  refreshAccessSession,
} from "@/services/auth.api";

const realFetch = globalThis.fetch;

const stub = {
  refreshCalls: 0,
  refreshOk: true,
  protectedHits: 0,
  failProtectedHits: 0,
  protectedRaw: null as string | null,
  logoutOk: true,
};

const fetchMock = mock(
  async (input: unknown, _init?: RequestInit): Promise<Response> => {
    const url =
      typeof input === "string"
        ? input
        : input instanceof URL
          ? input.href
          : (input as Request).url;
    if (url.endsWith("/api/auth/refresh")) {
      stub.refreshCalls += 1;
      await new Promise((resolve) => setTimeout(resolve, 5));
      return new Response("{}", { status: stub.refreshOk ? 200 : 401 });
    }
    if (url.endsWith("/api/auth/login")) {
      return Response.json({ user: { id: "u1" } });
    }
    if (
      url.endsWith("/api/auth/logout") ||
      url.endsWith("/api/auth/logout-all")
    ) {
      if (!stub.logoutOk) {
        return Response.json(
          { errors: { form: "Đã có lỗi xảy ra." } },
          { status: 400 },
        );
      }
      return new Response("{}", { status: 200 });
    }
    stub.protectedHits += 1;
    if (stub.protectedRaw !== null) {
      return new Response(stub.protectedRaw, { status: 400 });
    }
    if (stub.protectedHits <= stub.failProtectedHits) {
      return new Response("{}", { status: 401 });
    }
    return Response.json({ ok: true });
  },
);

globalThis.fetch = fetchMock as unknown as typeof fetch;

async function flushReconnect(): Promise<void> {
  for (let i = 0; i < 5; i += 1) {
    await new Promise((resolve) => setTimeout(resolve, 0));
  }
}

beforeEach(() => {
  stub.refreshCalls = 0;
  stub.refreshOk = true;
  stub.protectedHits = 0;
  stub.failProtectedHits = 0;
  stub.protectedRaw = null;
  stub.logoutOk = true;
  reconnectMock.mockClear();
});

afterAll(() => {
  globalThis.fetch = realFetch;
});

describe("auth session refresh", () => {
  test("coalesces concurrent 401 refreshes into one POST", async () => {
    stub.failProtectedHits = 2;
    const [first, second] = await Promise.all([
      apiRequest("/api/mechanic/bookings"),
      apiRequest("/api/bookings"),
    ]);
    expect(first).toEqual({ ok: true });
    expect(second).toEqual({ ok: true });
    expect(stub.refreshCalls).toBe(1);
    await flushReconnect();
    expect(reconnectMock.mock.calls.length).toBe(1);
  });

  test("retries a fresh refresh after a failed single-flight", async () => {
    stub.refreshOk = false;
    stub.failProtectedHits = 1;
    await expect(apiRequest("/api/mechanic/bookings")).rejects.toMatchObject({
      status: 401,
    });
    expect(stub.refreshCalls).toBe(1);

    stub.refreshOk = true;
    stub.protectedHits = 0;
    stub.failProtectedHits = 1;
    await expect(apiRequest("/api/mechanic/bookings")).resolves.toEqual({
      ok: true,
    });
    expect(stub.refreshCalls).toBe(2);
  });

  test("reports refresh failure without touching the socket", async () => {
    stub.refreshOk = false;
    await expect(refreshAccessSession()).resolves.toBe(false);
    await flushReconnect();
    expect(reconnectMock.mock.calls.length).toBe(0);
  });

  test("rebuilds the socket on login and logout success", async () => {
    await loginRequest({ identifier: "0912345678", password: "secret123" });
    await flushReconnect();
    expect(reconnectMock.mock.calls.length).toBe(1);

    await logoutRequest();
    await flushReconnect();
    expect(reconnectMock.mock.calls.length).toBe(2);

    await logoutAllRequest();
    await flushReconnect();
    expect(reconnectMock.mock.calls.length).toBe(3);
  });

  test("failed logout rejects and never touches the socket", async () => {
    stub.logoutOk = false;
    await expect(logoutRequest()).rejects.toBeInstanceOf(AuthApiError);
    await expect(logoutAllRequest()).rejects.toBeInstanceOf(AuthApiError);
    await flushReconnect();
    expect(reconnectMock.mock.calls.length).toBe(0);
  });

  test("malformed null error bodies still surface as AuthApiError", async () => {
    stub.protectedRaw = "null";
    const failure = await apiRequest("/api/mechanic/bookings").catch(
      (error: unknown) => error,
    );
    expect(failure).toBeInstanceOf(AuthApiError);
    expect((failure as AuthApiError).status).toBe(400);
    expect((failure as AuthApiError).errors.form).toBeTruthy();
  });
});
