import { describe, expect, test } from "bun:test";
import {
  emptyRescueAddress,
  emptyRescueVehicle,
  isRescueFormDirty,
  resolveRescueContact,
} from "@/components/rescue/rescue-form-state";
import { makePublicUser } from "../helpers/auth.fixtures";

// Pure form-state helpers behind /rescue: contact resolution picks the
// inputs a session still needs, and the dirty check arms the native
// beforeunload warning. No React, no mocks.
describe("resolveRescueContact", () => {
  test("guests type all three contact fields", () => {
    const resolved = resolveRescueContact(null, {
      fullName: "Tran B",
      phone: "0909000111",
      email: "tranb@example.com",
    });
    expect(resolved.showNameInput).toBe(true);
    expect(resolved.showPhoneInput).toBe(true);
    expect(resolved.showEmailInput).toBe(true);
    expect(resolved.accountName).toBe("");
    expect(resolved.accountPhone).toBe("");
    expect(resolved.accountEmail).toBe("");
    expect(resolved.fullName).toBe("Tran B");
    expect(resolved.phone).toBe("0909000111");
    expect(resolved.email).toBe("tranb@example.com");
  });

  test("a signed-in account supplies every value and hides the inputs", () => {
    const resolved = resolveRescueContact(makePublicUser(), {
      fullName: "",
      phone: "",
      email: "",
    });
    expect(resolved.showNameInput).toBe(false);
    expect(resolved.showPhoneInput).toBe(false);
    expect(resolved.showEmailInput).toBe(false);
    expect(resolved.fullName).toBe("Nguyen Van An");
    expect(resolved.phone).toBe("0912345678");
    expect(resolved.accountName).toBe("Nguyen Van An");
    expect(resolved.accountPhone).toBe("0912345678");
  });

  test("account values win over anything typed before the session landed", () => {
    const resolved = resolveRescueContact(makePublicUser(), {
      fullName: "Typed Name",
      phone: "0901111222",
      email: "typed@example.com",
    });
    expect(resolved.fullName).toBe("Nguyen Van An");
    expect(resolved.phone).toBe("0912345678");
    expect(resolved.email).toBe(resolved.accountEmail);
  });

  test("a missing account phone still asks for it", () => {
    const resolved = resolveRescueContact(makePublicUser({ phone: "  " }), {
      fullName: "",
      phone: "0902333444",
      email: "",
    });
    expect(resolved.showNameInput).toBe(false);
    expect(resolved.showPhoneInput).toBe(true);
    expect(resolved.fullName).toBe("Nguyen Van An");
    expect(resolved.phone).toBe("0902333444");
  });

  // Email is the OTP lookup key, so a profile without one must not leave the
  // field hidden: the rescue would become unreachable afterwards.
  test("a blank account email still asks for it", () => {
    const resolved = resolveRescueContact(makePublicUser({ email: "  " }), {
      fullName: "",
      phone: "",
      email: "guest@example.com",
    });
    expect(resolved.showEmailInput).toBe(true);
    expect(resolved.email).toBe("guest@example.com");
  });

  test("a blank account name still asks for it", () => {
    const resolved = resolveRescueContact(makePublicUser({ fullName: "" }), {
      fullName: "Tran B",
      phone: "",
      email: "",
    });
    expect(resolved.showNameInput).toBe(true);
    expect(resolved.showPhoneInput).toBe(false);
    expect(resolved.fullName).toBe("Tran B");
    expect(resolved.phone).toBe("0912345678");
  });

  test("an account with no contact fields degrades to the guest path", () => {
    const resolved = resolveRescueContact(
      makePublicUser({ fullName: "", phone: "", email: "" }),
      { fullName: "Tran B", phone: "0909000111", email: "t@example.com" },
    );
    expect(resolved.showNameInput).toBe(true);
    expect(resolved.showPhoneInput).toBe(true);
    expect(resolved.showEmailInput).toBe(true);
    expect(resolved.fullName).toBe("Tran B");
    expect(resolved.phone).toBe("0909000111");
    expect(resolved.email).toBe("t@example.com");
  });
});

describe("isRescueFormDirty", () => {
  function cleanArgs() {
    return {
      fullName: "",
      phone: "",
      email: "",
      issueType: "",
      description: "",
      coords: null,
      address: emptyRescueAddress(),
      vehicle: emptyRescueVehicle(),
      pending: false,
    };
  }

  test("a pristine form navigates away silently", () => {
    expect(isRescueFormDirty(cleanArgs())).toBe(false);
  });

  test("whitespace-only fields do not count as input", () => {
    expect(
      isRescueFormDirty({
        ...cleanArgs(),
        fullName: "   ",
        phone: "  ",
        description: " \n ",
      }),
    ).toBe(false);
  });

  test("typed contact, issue and description mark the form dirty", () => {
    expect(isRescueFormDirty({ ...cleanArgs(), fullName: "An" })).toBe(true);
    expect(isRescueFormDirty({ ...cleanArgs(), phone: "09" })).toBe(true);
    expect(isRescueFormDirty({ ...cleanArgs(), email: "a@b.co" })).toBe(true);
    expect(isRescueFormDirty({ ...cleanArgs(), issueType: "flat_tire" })).toBe(
      true,
    );
    expect(isRescueFormDirty({ ...cleanArgs(), description: "x" })).toBe(true);
  });

  test("a pinned location marks the form dirty", () => {
    expect(
      isRescueFormDirty({
        ...cleanArgs(),
        coords: { lat: 10.7769, lng: 106.7009 },
      }),
    ).toBe(true);
  });

  test("any address or vehicle field marks the form dirty", () => {
    expect(
      isRescueFormDirty({
        ...cleanArgs(),
        address: { ...emptyRescueAddress(), ward: "Phuong 5" },
      }),
    ).toBe(true);
    expect(
      isRescueFormDirty({
        ...cleanArgs(),
        vehicle: { ...emptyRescueVehicle(), vehiclePlate: "51F" },
      }),
    ).toBe(true);
    expect(
      isRescueFormDirty({
        ...cleanArgs(),
        vehicle: { ...emptyRescueVehicle(), vehicleBrand: "Honda" },
      }),
    ).toBe(true);
  });

  test("an in-flight submit counts as unsaved", () => {
    expect(isRescueFormDirty({ ...cleanArgs(), pending: true })).toBe(true);
  });
});
