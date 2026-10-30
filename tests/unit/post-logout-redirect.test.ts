import { describe, expect, test } from "bun:test";
import { postLogoutHref, requiresLogin } from "@/lib/auth/auth-redirect";

// Regression guard for "logged out but still inside the admin portal":
// logging out from a login-gated staff tree must navigate to /login, while
// public pages stay where they are.

describe("requiresLogin", () => {
  test("matches every staff tree and its subpaths", () => {
    for (const path of [
      "/admin",
      "/admin/users",
      "/dispatch",
      "/dispatch/orders/page/2",
      "/mechanic",
      "/mechanic/schedule/all",
    ]) {
      expect(requiresLogin(path)).toBe(true);
    }
  });

  test("ignores public pages and look-alike prefixes", () => {
    for (const path of [
      "/",
      "/services",
      "/booking",
      "/administrator",
      "/dispatcher-info",
    ]) {
      expect(requiresLogin(path)).toBe(false);
    }
    expect(requiresLogin(null)).toBe(false);
    expect(requiresLogin(undefined)).toBe(false);
  });
});

describe("postLogoutHref", () => {
  test("sends staff routes to the login page", () => {
    expect(postLogoutHref("/admin/settings")).toBe("/login");
    expect(postLogoutHref("/dispatch")).toBe("/login");
  });

  test("keeps public routes in place", () => {
    expect(postLogoutHref("/services/engine")).toBeNull();
    expect(postLogoutHref(null)).toBeNull();
  });
});
