// Detail URLs stay English and never clash with the /page/N pager.
import { describe, expect, test } from "bun:test";
import {
  campaignDetailHref,
  walletDetailHref,
} from "@/components/vouchers/voucher-detail-href";

describe("voucher detail hrefs", () => {
  test("wallet detail lives under /vouchers/w", () => {
    expect(walletDetailHref("wallet-1")).toBe("/vouchers/w/wallet-1");
  });

  test("campaign detail lives under /vouchers/c with a clean slug", () => {
    expect(campaignDetailHref("Chao-Mung")).toBe("/vouchers/c/chao-mung");
  });
});
