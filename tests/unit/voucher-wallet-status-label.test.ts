// Customer-facing wallet label: an active wallet that cannot be spent is
// never shown as "Còn hiệu lực".
import { describe, expect, test } from "bun:test";
import { walletStatusLabel } from "@/components/vouchers/wallet-status-label";

describe("walletStatusLabel", () => {
  test("a spendable active wallet reads as still valid", () => {
    expect(walletStatusLabel({ status: "active", spendable: true })).toBe(
      "Còn hiệu lực",
    );
  });

  test("an active wallet that cannot be spent reads as paused", () => {
    expect(walletStatusLabel({ status: "active", spendable: false })).toBe(
      "Tạm ngưng",
    );
  });

  test("terminal statuses keep their own labels", () => {
    expect(walletStatusLabel({ status: "used", spendable: false })).toBe(
      "Đã dùng",
    );
    expect(walletStatusLabel({ status: "expired", spendable: false })).toBe(
      "Hết hạn",
    );
    expect(walletStatusLabel({ status: "revoked", spendable: false })).toBe(
      "Đã thu hồi",
    );
  });
});
