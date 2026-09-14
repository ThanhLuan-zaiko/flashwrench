import { beforeEach, describe, expect, mock, test } from "bun:test";
import { makeRegisterInput } from "../helpers/auth.fixtures";
import {
  dbState,
  resetDbFake,
  scyllaMocks,
  scyllaStub,
} from "../helpers/db-fake";
import { passwordMocks } from "../helpers/service-mocks";

// Regression suite for duplicate-account protection. Unlike the integration
// suites (which stub repositories), this file runs the REAL `registerUser`
// and the REAL `user.repository` against an in-memory Scylla fake, so it
// guards the exact bug class we fixed: TOCTOU races and bypasses in the
// check-then-insert path. Only the hasher is stubbed (real Argon2id is
// covered by `tests/unit/password.test.ts`).
mock.module("@/lib/db/client", () => ({ scylla: scyllaStub }));
mock.module("@/lib/auth/password", () => passwordMocks);

import { registerUser } from "@/lib/auth/auth.service";

const P1 = "0911111111";
const P2 = "0922222222";
const P3 = "0933333333";
const P4 = "0944444444";

beforeEach(() => {
  resetDbFake();
});

describe("duplicate phone and email", () => {
  test("second registration with the same phone gets 409", async () => {
    const first = await registerUser(
      makeRegisterInput({ phone: P1, email: "first@example.com" }),
      "device",
    );
    expect(first.ok).toBe(true);
    const second = await registerUser(
      makeRegisterInput({ phone: P1, email: "second@example.com" }),
      "device",
    );
    expect(second).toMatchObject({ ok: false, status: 409 });
    if (second.ok) return;
    expect(second.errors.phone).toBeDefined();
    expect(dbState.users.size).toBe(1);
  });

  test("second registration with the same email gets 409", async () => {
    await registerUser(
      makeRegisterInput({ phone: P1, email: "same@example.com" }),
      "device",
    );
    const second = await registerUser(
      makeRegisterInput({ phone: P2, email: "same@example.com" }),
      "device",
    );
    expect(second).toMatchObject({ ok: false, status: 409 });
    if (second.ok) return;
    expect(second.errors.email).toBeDefined();
    expect(dbState.users.size).toBe(1);
  });
});

describe("phone normalization bypass", () => {
  test("+84 spellings map to the same stored number", async () => {
    await registerUser(makeRegisterInput({ phone: P1 }), "device");
    for (const spelling of [`+84${P1.slice(1)}`, `84${P1.slice(1)}`]) {
      const attempt = await registerUser(
        makeRegisterInput({
          phone: spelling,
          email: `${spelling}@example.com`,
        }),
        "device",
      );
      expect(attempt).toMatchObject({ ok: false, status: 409 });
    }
    expect(dbState.phones.size).toBe(1);
    expect(dbState.users.size).toBe(1);
  });
});

describe("concurrent duplicate registration", () => {
  test("exactly one of two simultaneous registers succeeds", async () => {
    const input = makeRegisterInput({ phone: P1, email: "race@example.com" });
    const [first, second] = await Promise.all([
      registerUser(input, "device-a"),
      registerUser(input, "device-b"),
    ]);
    const winners = [first, second].filter((r) => r.ok);
    const losers = [first, second].filter((r) => !r.ok);
    expect(winners.length).toBe(1);
    expect(losers.length).toBe(1);
    expect(losers[0]).toMatchObject({ ok: false, status: 409 });
    expect(dbState.users.size).toBe(1);
  });
});

describe("failed claims leave no residue", () => {
  test("losing the email claim releases the phone claim", async () => {
    await registerUser(
      makeRegisterInput({ phone: P1, email: "taken@example.com" }),
      "device",
    );
    const conflict = await registerUser(
      makeRegisterInput({ phone: P2, email: "taken@example.com" }),
      "device",
    );
    expect(conflict).toMatchObject({ ok: false, status: 409 });
    // P2 must be reusable, proving its phone claim was rolled back.
    const reuse = await registerUser(
      makeRegisterInput({ phone: P2, email: "free@example.com" }),
      "device",
    );
    expect(reuse.ok).toBe(true);
  });

  test("losing the phone claim never stores the email", async () => {
    await registerUser(
      makeRegisterInput({ phone: P1, email: "first@example.com" }),
      "device",
    );
    const conflict = await registerUser(
      makeRegisterInput({ phone: P1, email: "fresh@example.com" }),
      "device",
    );
    expect(conflict).toMatchObject({ ok: false, status: 409 });
    const reuse = await registerUser(
      makeRegisterInput({ phone: P3, email: "fresh@example.com" }),
      "device",
    );
    expect(reuse.ok).toBe(true);
  });

  test("a storage failure cleans up both claims", async () => {
    dbState.failBatch = true;
    await expect(
      registerUser(makeRegisterInput({ phone: P4 }), "device"),
    ).rejects.toThrow();
    expect(dbState.phones.has(P4)).toBe(false);
    expect(dbState.emails.has("an@example.com")).toBe(false);
    expect(dbState.users.size).toBe(0);
  });
});

describe("uniqueness is enforced by lightweight transactions", () => {
  test("claims use IF NOT EXISTS instead of plain upserts", async () => {
    await registerUser(makeRegisterInput({ phone: P1 }), "device");
    const statements = scyllaMocks.execute.mock.calls.map((call) => call[0]);
    expect(
      statements.some(
        (query) =>
          query.includes("users_by_phone") && query.includes("IF NOT EXISTS"),
      ),
    ).toBe(true);
    expect(
      statements.some(
        (query) =>
          query.includes("users_by_email") && query.includes("IF NOT EXISTS"),
      ),
    ).toBe(true);
  });
});
