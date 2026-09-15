import { describe, expect, test } from "bun:test";
import {
  fieldError,
  formError,
} from "@/app/admin/components/services/catalog-errors";
import { AuthApiError } from "@/services/service-catalog.api";

describe("catalog-errors fieldError", () => {
  test("reads field messages from AuthApiError", () => {
    const error = new AuthApiError(400, { slug: "Slug exists." } as never);
    expect(fieldError(error, "slug")).toBe("Slug exists.");
    expect(fieldError(error, "name")).toBeUndefined();
  });

  test("returns undefined for non-api errors", () => {
    expect(fieldError(new Error("boom"), "slug")).toBeUndefined();
    expect(fieldError(null, "slug")).toBeUndefined();
  });
});

describe("catalog-errors formError", () => {
  test("prefers form, then confirm, then the generic message", () => {
    expect(
      formError(new AuthApiError(400, { form: "Soft delete blocked." })),
    ).toBe("Soft delete blocked.");
    expect(
      formError(new AuthApiError(400, { confirm: "Wrong slug." } as never)),
    ).toBe("Wrong slug.");
  });

  test("returns null without an error and fallback otherwise", () => {
    expect(formError(null)).toBeNull();
    expect(formError(undefined)).toBeNull();
    expect(formError(new Error("boom"), "Custom fallback.")).toBe(
      "Custom fallback.",
    );
  });
});
