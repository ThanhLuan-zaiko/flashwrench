import { describe, expect, test } from "bun:test";
import {
  defaultMapCenter,
  toMapAddressValues,
  toPhotonLabel,
} from "@/services/geocode.api";

// Pure Photon mapping behind the booking map picker: admin levels vary
// by country, so only the Vietnamese ones fill the address fields.
// No network, no mocks.

describe("toMapAddressValues", () => {
  test("maps a full Vietnamese address into the booking fields", () => {
    const values = toMapAddressValues("ignored label", {
      housenumber: "123",
      street: "Đường Nguyễn Trãi",
      locality: "Khu phố 18",
      district: "Phường An Đông",
      county: "Quận 5",
      state: "Thành phố Hồ Chí Minh",
    });
    expect(values).toEqual({
      address:
        "123 Đường Nguyễn Trãi, Phường An Đông, Quận 5, Thành phố Hồ Chí Minh",
      street: "123 Đường Nguyễn Trãi",
      ward: "Phường An Đông",
      district: "Quận 5",
      province: "Thành phố Hồ Chí Minh",
    });
  });

  test("falls back across alternate Photon levels", () => {
    const values = toMapAddressValues("label", {
      street: "Đường Lê Lợi",
      locality: "Khu phố 2",
      city: "Thành phố Thủ Đức",
      state: "Thành phố Hồ Chí Minh",
    });
    expect(values.street).toBe("Đường Lê Lợi");
    expect(values.ward).toBe("Khu phố 2");
    expect(values.district).toBe("Thành phố Thủ Đức");
    expect(values.province).toBe("Thành phố Hồ Chí Minh");
  });

  test("uses the place name as street when no street exists", () => {
    const values = toMapAddressValues("label", {
      name: "Bệnh viện Nguyễn Trãi",
      district: "Phường An Đông",
      city: "Thành phố Hồ Chí Minh",
    });
    expect(values.street).toBe("Bệnh viện Nguyễn Trãi");
    expect(values.ward).toBe("Phường An Đông");
    expect(values.district).toBe("Thành phố Hồ Chí Minh");
    expect(values.province).toBe("Thành phố Hồ Chí Minh");
    expect(values.address).toBe(
      "Bệnh viện Nguyễn Trãi, Phường An Đông, Thành phố Hồ Chí Minh",
    );
  });

  test("falls back to the label when no parts exist", () => {
    const values = toMapAddressValues("Somewhere, Vietnam", undefined);
    expect(values.address).toBe("Somewhere, Vietnam");
    expect(values.street).toBe("");
    expect(values.province).toBe("");
  });

  test("defaults the map view to Ho Chi Minh City", () => {
    expect(defaultMapCenter()).toEqual({ lat: 10.7769, lng: 106.7009 });
  });
});

describe("toPhotonLabel", () => {
  test("joins the place name, street line and admin chain", () => {
    const label = toPhotonLabel({
      name: "Bệnh viện Nguyễn Trãi",
      housenumber: "314",
      street: "Đường Nguyễn Trãi",
      district: "An Đông",
      city: "Thành phố Hồ Chí Minh",
    });
    expect(label).toBe(
      "Bệnh viện Nguyễn Trãi, 314 Đường Nguyễn Trãi, An Đông, Thành phố Hồ Chí Minh",
    );
  });

  test("drops repeated admin levels", () => {
    const label = toPhotonLabel({
      name: "Nguyễn Trãi",
      district: "Lái Thiêu",
      city: "Thành phố Hồ Chí Minh",
      state: "Thành phố Hồ Chí Minh",
    });
    expect(label).toBe("Nguyễn Trãi, Lái Thiêu, Thành phố Hồ Chí Minh");
  });
});
