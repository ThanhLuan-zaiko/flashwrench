// Pure helpers behind the canvas + GSAP chart kit: axis math, the tween
// interpolation that morphs realtime updates, palette folding and the
// theme-aware colors. No DOM, no mocks.
import { describe, expect, test } from "bun:test";
import {
  compactVnd,
  labelStep,
  lerpSeries,
  niceCeil,
  seriesSignature,
  shares,
} from "@/components/charts/chart-math";
import { mixSegments } from "@/components/charts/chart-mix";
import {
  CHART_SERIES_DARK,
  CHART_SERIES_LIGHT,
  chartTheme,
  seriesColor,
  swatchClass,
  withAlpha,
} from "@/components/charts/chart-palette";

describe("niceCeil", () => {
  test("rounds up to a 1/2/5 step", () => {
    expect(niceCeil(7)).toBe(10);
    expect(niceCeil(1_300_000)).toBe(2_000_000);
    expect(niceCeil(45)).toBe(50);
  });

  test("guards empty, negative and non-finite input", () => {
    expect(niceCeil(0)).toBe(1);
    expect(niceCeil(-5)).toBe(1);
    expect(niceCeil(Number.NaN)).toBe(1);
  });
});

describe("compactVnd", () => {
  test("formats millions and thousands compactly", () => {
    expect(compactVnd(2_000_000)).toBe("2tr");
    expect(compactVnd(1_500_000)).toBe("1.5tr");
    expect(compactVnd(800_000)).toBe("800k");
    expect(compactVnd(950)).toBe("950");
  });
});

describe("lerpSeries", () => {
  test("interpolates between two equal-length series", () => {
    expect(lerpSeries([0, 10], [10, 20], 0.5)).toEqual([5, 15]);
    expect(lerpSeries([4, 4], [8, 0], 1)).toEqual([8, 0]);
  });

  test("new points grow from zero and dropped points disappear", () => {
    expect(lerpSeries([10], [10, 20], 0.5)).toEqual([10, 10]);
    expect(lerpSeries([1, 2, 3], [5], 0)).toEqual([1]);
  });
});

describe("labelStep, shares and signature", () => {
  test("labelStep keeps at most N labels", () => {
    expect(labelStep(24)).toBe(4);
    expect(labelStep(5)).toBe(1);
    expect(labelStep(0)).toBe(1);
  });

  test("shares normalizes and is safe for all-zero lists", () => {
    expect(shares([1, 3])).toEqual([0.25, 0.75]);
    expect(shares([0, 0])).toEqual([0, 0]);
    expect(shares([-2, 2])).toEqual([0, 1]);
  });

  test("signature changes only when values change", () => {
    expect(seriesSignature([1, 2])).toBe(seriesSignature([1, 2]));
    expect(seriesSignature([1, 2])).not.toBe(seriesSignature([1, 3]));
  });
});

describe("mixSegments", () => {
  test("keeps short lists and folds the tail into the last hue", () => {
    expect(mixSegments([5, 3])).toEqual([5, 3]);
    expect(mixSegments([5, 4, 3, 2, 1])).toEqual([5, 4, 3, 3]);
    expect(mixSegments([])).toEqual([]);
  });
});

describe("chart palette", () => {
  test("uses the approved order in light and a readable first hue in dark", () => {
    expect(chartTheme(false).series).toEqual(CHART_SERIES_LIGHT);
    expect(chartTheme(true).series).toEqual(CHART_SERIES_DARK);
    expect(CHART_SERIES_LIGHT[0]).toBe("#1E3A5F");
    expect(CHART_SERIES_DARK[0]).not.toBe("#1E3A5F");
  });

  test("series and swatches cycle within the palette", () => {
    const theme = chartTheme(false);
    expect(seriesColor(theme, 4)).toBe(seriesColor(theme, 0));
    expect(swatchClass(5)).toBe(swatchClass(1));
  });

  test("withAlpha converts hex to rgba", () => {
    expect(withAlpha("#1E3A5F", 0.5)).toBe("rgba(30, 58, 95, 0.5)");
  });
});
