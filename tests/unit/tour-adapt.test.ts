// Pure tour adaptation: routes are re-derived from the page of each
// neighbouring step, explicit routes on plain steps are kept, and the
// wizardStep hint survives for the card to act on.
import { describe, expect, test } from "bun:test";
import type { Tour } from "nextstepjs";
import { adaptTours, type GuideTour } from "@/components/tour/tour-adapt";

const SOURCE: GuideTour[] = [
  {
    tour: "t",
    steps: [
      { selector: "#a", title: "A", content: "a", page: "/one" },
      { selector: "#b", title: "B", content: "b", page: "/two", wizardStep: 1 },
      { selector: "#c", title: "C", content: "c", page: "/two" },
      { selector: "#d", title: "D", content: "d", page: "/three" },
    ],
  },
];

function steps() {
  return adaptTours(SOURCE)[0]?.steps ?? [];
}

describe("adaptTours", () => {
  test("keeps every step and its selector in order", () => {
    expect(steps().map((step) => step.selector)).toEqual([
      "#a",
      "#b",
      "#c",
      "#d",
    ]);
  });

  test("routes point at the neighbouring page only when it changes", () => {
    const out = steps();
    expect(out[0]?.nextRoute).toBe("/two");
    expect(out[0]?.prevRoute).toBeUndefined();
    expect(out[1]?.nextRoute).toBeUndefined();
    expect(out[1]?.prevRoute).toBe("/one");
    expect(out[2]?.nextRoute).toBe("/three");
    expect(out[3]?.prevRoute).toBe("/two");
    expect(out[3]?.nextRoute).toBeUndefined();
  });

  test("the wizard hint reaches the step object", () => {
    expect((steps()[1] as { wizardStep?: number }).wizardStep).toBe(1);
  });

  test("plain steps without a page pass through unchanged", () => {
    const plain: Tour[] = [
      {
        tour: "p",
        steps: [
          { selector: "#x", title: "X", content: "x", nextRoute: "/keep" },
          { selector: "#y", title: "Y", content: "y" },
        ],
      },
    ];
    const out = adaptTours(plain)[0]?.steps ?? [];
    expect(out[0]?.nextRoute).toBe("/keep");
    expect(out[1]?.nextRoute).toBeUndefined();
  });
});
