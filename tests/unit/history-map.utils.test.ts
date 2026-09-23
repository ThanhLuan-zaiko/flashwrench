import { describe, expect, test } from "bun:test";
import { historyMapModel } from "@/components/history/history-map.utils";

describe("history map model", () => {
  test("keeps the customer map visible while route samples are pending", () => {
    expect(
      historyMapModel({ lat: 10.77, lng: 106.7 }, null, []),
    ).toEqual({
      customer: { lat: 10.77, lng: 106.7 },
      mechanic: null,
      route: undefined,
      hasMap: true,
    });
  });

  test("shows a current mechanic pin even before route samples exist", () => {
    expect(
      historyMapModel(null, { lat: 10.78, lng: 106.71 }, []),
    ).toMatchObject({ mechanic: { lat: 10.78, lng: 106.71 }, hasMap: true });
  });

  test("draws a route only when at least two GPS samples exist", () => {
    const point = (lat: number, lng: number) => ({
      lat,
      lng,
      recordedAt: "2026-09-24T02:00:00.000Z",
    });

    expect(
      historyMapModel(null, null, [point(10.77, 106.7)]).route,
    ).toBeUndefined();
    expect(
      historyMapModel(null, null, [point(10.77, 106.7), point(10.78, 106.71)]),
    ).toMatchObject({
      hasMap: true,
      route: [
        { lat: 10.77, lng: 106.7 },
        { lat: 10.78, lng: 106.71 },
      ],
    });
  });
});
