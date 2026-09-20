import { describe, expect, test } from "bun:test";
import {
  needsBasePoint,
  presenceStatusText,
} from "../../app/mechanic/components/presence-form.utils";

describe("needsBasePoint", () => {
  test("online requires both coordinates", () => {
    expect(needsBasePoint({ online: true, baseLat: null, baseLng: null })).toBe(
      true,
    );
    expect(
      needsBasePoint({ online: true, baseLat: 10.99, baseLng: null }),
    ).toBe(true);
    expect(
      needsBasePoint({ online: true, baseLat: 10.99, baseLng: 106.66 }),
    ).toBe(false);
  });

  test("offline never needs a base point", () => {
    expect(
      needsBasePoint({ online: false, baseLat: null, baseLng: null }),
    ).toBe(false);
  });
});

describe("presenceStatusText", () => {
  test("loading and offline fall back to neutral copy", () => {
    expect(presenceStatusText(true, false, null)).toBe("Đang tải trạng thái…");
    expect(presenceStatusText(false, false, "Trần Văn Thợ")).toBe(
      "Đang ngoại tuyến — bật để nhận đơn.",
    );
  });

  test("online names the mechanic or defaults to Bạn", () => {
    expect(presenceStatusText(false, true, "Trần Văn Thợ")).toBe(
      "Trần Văn Thợ đang trực tuyến.",
    );
    expect(presenceStatusText(false, true, null)).toBe("Bạn đang trực tuyến.");
  });
});
