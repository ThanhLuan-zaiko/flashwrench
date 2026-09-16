import { describe, expect, test } from "bun:test";
import {
  type ChildSpec,
  devChildren,
  startChildren,
} from "@/scripts/proc-config";

function byName(specs: ChildSpec[], name: string): ChildSpec {
  const found = specs.find((spec) => spec.name === name);
  if (!found) throw new Error(`Missing child spec: ${name}`);
  return found;
}

describe("composite run scripts", () => {
  test("dev mode pairs Turbopack HMR with a hot-reloading gateway", () => {
    const specs = devChildren();

    expect(byName(specs, "web").cmd).toEqual(["bun", "run", "dev"]);
    expect(byName(specs, "realtime").cmd).toEqual([
      "bun",
      "--hot",
      "realtime/server.ts",
    ]);
  });

  test("start mode serves built assets with no file watching", () => {
    const specs = startChildren();

    expect(byName(specs, "web").cmd).toEqual(["bun", "run", "start"]);
    expect(byName(specs, "realtime").cmd).toEqual([
      "bun",
      "run",
      "realtime/server.ts",
    ]);
    for (const spec of specs) {
      expect(spec.cmd.includes("--hot")).toBe(false);
      expect(spec.cmd.includes("--watch")).toBe(false);
    }
  });

  test("child names stay unique within each mode", () => {
    for (const specs of [devChildren(), startChildren()]) {
      const names = specs.map((spec) => spec.name);
      expect(new Set(names).size).toBe(names.length);
    }
  });
});
