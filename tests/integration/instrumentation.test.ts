import { afterEach, describe, expect, mock, test } from "bun:test";

// Helpers first, mocks second, system under test last: bun hoists
// mock.module above imports, and the factory hands out the deferred probe
// below so each test controls exactly when the ScyllaDB check finishes.
let releaseProbe: () => void = () => undefined;
let probeFinished = false;
const checkCalls: unknown[][] = [];
mock.module("@/lib/db/check-connection", () => ({
  checkScyllaConnection: mock((...args: unknown[]) => {
    checkCalls.push(args);
    return new Promise<void>((resolve) => {
      releaseProbe = () => {
        probeFinished = true;
        resolve();
      };
    });
  }),
}));

import { register } from "@/instrumentation";

afterEach(() => {
  delete process.env.NEXT_RUNTIME;
  checkCalls.length = 0;
  probeFinished = false;
  releaseProbe = () => undefined;
});

describe("instrumentation register", () => {
  test("resolves without waiting for a slow ScyllaDB probe", async () => {
    process.env.NEXT_RUNTIME = "nodejs";

    await register();

    // The boot hook is done while the database probe is still in flight:
    // a slow database must never delay the server or the first paint.
    expect(probeFinished).toBe(false);
    await Bun.sleep(10);
    expect(checkCalls.length).toBe(1);

    releaseProbe();
    await Bun.sleep(10);
    expect(probeFinished).toBe(true);
  });

  test("skips the probe outside the Node.js runtime", async () => {
    delete process.env.NEXT_RUNTIME;

    await register();
    await Bun.sleep(10);

    expect(checkCalls.length).toBe(0);
  });
});
