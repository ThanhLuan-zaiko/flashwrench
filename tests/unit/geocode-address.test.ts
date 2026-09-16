import { describe, expect, test } from "bun:test";
import { defaultMapCenter, toMapAddressValues } from "@/services/geocode.api";

// Pure Nominatim mapping behind the booking map picker: admin levels
// vary by country, so only the Vietnamese ones fill the address fields.
// No network, no mocks.

describe("toMapAddressValues", () => {
  test("maps a full Vietnamese address into the booking fields", () => {
    const values = toMapAddressValues("ignored display name", {
      house_number: "123",
      road: "Nguyen Trai",
      suburb: "Phuong 5",
      city_district: "Quan 3",
      city: "TP Ho Chi Minh",
    });
    expect(values).toEqual({
      address: "123 Nguyen Trai, Phuong 5, Quan 3, TP Ho Chi Minh",
      street: "123 Nguyen Trai",
      ward: "Phuong 5",
      district: "Quan 3",
      province: "TP Ho Chi Minh",
    });
  });

  test("falls back across alternate Nominatim levels", () => {
    const values = toMapAddressValues("display", {
      road: "Le Loi",
      quarter: "Khu pho 2",
      county: "Thu Duc",
      state: "Ho Chi Minh",
    });
    expect(values.street).toBe("Le Loi");
    expect(values.ward).toBe("Khu pho 2");
    expect(values.district).toBe("Thu Duc");
    expect(values.province).toBe("Ho Chi Minh");
  });

  test("falls back to the display name when no parts exist", () => {
    const values = toMapAddressValues("Somewhere, Vietnam", undefined);
    expect(values.address).toBe("Somewhere, Vietnam");
    expect(values.street).toBe("");
    expect(values.province).toBe("");
  });

  test("defaults the map view to Ho Chi Minh City", () => {
    expect(defaultMapCenter()).toEqual({ lat: 10.7769, lng: 106.7009 });
  });
});
