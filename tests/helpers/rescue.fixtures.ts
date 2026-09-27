import type { CreateRescueInput } from "@/lib/rescue/rescue.types";

// Builders for the public rescue suites. Each test derives its own
// input instead of mutating shared objects.
export function makeRescueInput(
  overrides?: Partial<CreateRescueInput>,
): CreateRescueInput {
  return {
    fullName: "Nguyen Van An",
    phone: "0912345678",
    issueType: "flat_tire",
    description: "Xe xep lop truoc ben phai.",
    vehiclePlate: "51F-12345",
    vehicleBrand: "Honda",
    vehicleModel: "Wave Alpha",
    address: "123 Nguyen Trai, Phuong 5, Quan 3, TP Ho Chi Minh",
    province: "TP Ho Chi Minh",
    district: "Quan 3",
    ward: "Phuong 5",
    street: "123 Nguyen Trai",
    lat: 10.7769,
    lng: 106.7009,
    ...overrides,
  };
}
