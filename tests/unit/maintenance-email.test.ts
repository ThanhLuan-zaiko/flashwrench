// Reminder email: escapes the vehicle name and never carries a plate.
import { describe, expect, test } from "bun:test";
import { buildMaintenanceReminderEmail } from "@/lib/mail/maintenance-email";

describe("buildMaintenanceReminderEmail", () => {
  test("escapes the vehicle name in html", () => {
    const content = buildMaintenanceReminderEmail({
      vehicleName: "<b>Vios</b>",
      dueText: "vào khoảng 03/11/2026",
      unsubscribeUrl: "https://example.test/u",
    });
    expect(content.html).not.toContain("<b>Vios</b>");
    expect(content.html).toContain("&lt;b&gt;Vios&lt;/b&gt;");
  });

  test("falls back to a generic name when the vehicle has none", () => {
    const content = buildMaintenanceReminderEmail({
      vehicleName: "  ",
      dueText: "vào khoảng 03/11/2026",
      unsubscribeUrl: "https://example.test/u",
    });
    expect(content.subject).toContain("xe của bạn");
  });
});
