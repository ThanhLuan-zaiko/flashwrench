import { describe, expect, test } from "bun:test";
import { join } from "node:path";
import { standalonePlan } from "@/scripts/standalone";

const ROOT = join("repo");
const STANDALONE = join(ROOT, ".next", "standalone");

describe("standalone start plan", () => {
  test("copies static assets and public into the standalone folder", () => {
    const steps = standalonePlan(ROOT);

    expect(steps).toContainEqual({
      kind: "copy",
      from: join(ROOT, ".next", "static"),
      to: join(STANDALONE, ".next", "static"),
    });
    expect(steps).toContainEqual({
      kind: "copy",
      from: join(ROOT, "public"),
      to: join(STANDALONE, "public"),
    });
  });

  test("links storage and asset instead of copying them", () => {
    const steps = standalonePlan(ROOT);

    // Uploads must land in the real project storage, not a throwaway copy.
    expect(steps).toContainEqual({
      kind: "link",
      target: join(ROOT, "storage"),
      path: join(STANDALONE, "storage"),
    });
    expect(steps).toContainEqual({
      kind: "link",
      target: join(ROOT, "asset"),
      path: join(STANDALONE, "asset"),
    });
    expect(
      steps.some(
        (step) =>
          step.kind === "copy" &&
          (step.from.endsWith("storage") || step.from.endsWith("asset")),
      ),
    ).toBe(false);
  });

  test("every step stays inside the project root", () => {
    for (const step of standalonePlan(ROOT)) {
      const paths =
        step.kind === "copy" ? [step.from, step.to] : [step.target, step.path];
      for (const path of paths) {
        expect(path.startsWith(ROOT)).toBe(true);
      }
    }
  });
});
