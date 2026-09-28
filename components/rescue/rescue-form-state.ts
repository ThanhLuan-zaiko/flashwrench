import type { PublicUser } from "@/lib/auth/user.types";
import type { MapPoint } from "../booking/MapPicker";

export type RescueAddressValues = {
  address: string;
  province: string;
  district: string;
  ward: string;
  street: string;
};

export type RescueVehicleValues = {
  vehiclePlate: string;
  vehicleBrand: string;
  vehicleModel: string;
};

export function emptyRescueAddress(): RescueAddressValues {
  return { address: "", province: "", district: "", ward: "", street: "" };
}

export function emptyRescueVehicle(): RescueVehicleValues {
  return { vehiclePlate: "", vehicleBrand: "", vehicleModel: "" };
}

export type RescueContactResolution = {
  fullName: string;
  phone: string;
  accountName: string;
  accountPhone: string;
  showNameInput: boolean;
  showPhoneInput: boolean;
};

// Signed-in customers already proved who they are, so the account's
// name and phone stand in for the contact inputs and win over anything
// typed before the session landed. A missing piece (profile without a
// number, blank name) still renders its input so the form degrades to
// the guest path field by field.
export function resolveRescueContact(
  account: Pick<PublicUser, "fullName" | "phone"> | null,
  typed: { fullName: string; phone: string },
): RescueContactResolution {
  const accountName = account?.fullName.trim() ?? "";
  const accountPhone = account?.phone.trim() ?? "";
  return {
    fullName: accountName || typed.fullName,
    phone: accountPhone || typed.phone,
    accountName,
    accountPhone,
    showNameInput: accountName === "",
    showPhoneInput: accountPhone === "",
  };
}

// True while the form holds anything unsent: typed text, a picked
// issue, a map pin, or an in-flight submit. Drives the sessionStorage
// draft and the in-app leave confirm. Pure so bun:test covers it
// without DOM.
export function isRescueFormDirty(args: {
  fullName: string;
  phone: string;
  issueType: string;
  description: string;
  coords: MapPoint | null;
  address: RescueAddressValues;
  vehicle: RescueVehicleValues;
  pending: boolean;
}): boolean {
  if (args.pending) return true;
  return (
    args.fullName.trim() !== "" ||
    args.phone.trim() !== "" ||
    args.issueType !== "" ||
    args.description.trim() !== "" ||
    args.coords !== null ||
    Object.values(args.address).some((value) => value.trim() !== "") ||
    Object.values(args.vehicle).some((value) => value.trim() !== "")
  );
}
