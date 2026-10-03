// Grant mail delivery: account email wins, missing config or address stays
// silent, and a failure never throws into the grant flow.
import { beforeEach, describe, expect, mock, test } from "bun:test";
import { makeUserRow } from "../helpers/auth.fixtures";
import {
  mailConfigMocks,
  mailerMocks,
  otpStubs,
  resetOtpMocks,
} from "../helpers/guest-access.mocks";
import {
  resetServiceMocks,
  serviceStubs,
  userRepoMocks,
} from "../helpers/service-mocks";

// Helpers first, mocks second, system under test last.
mock.module("@/lib/auth/user.repository", () => userRepoMocks);
mock.module("@/lib/mail/mailer.service", () => mailerMocks);
mock.module("@/lib/mail/mail.config", () => mailConfigMocks);

import { notifyVoucherGranted } from "@/lib/vouchers/voucher-notify.service";

function flush(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

const GRANT = {
  campaignName: "Chao mung tai khoan moi",
  discountType: "fixed",
  discountValue: 50000,
  maxDiscount: 0,
  minOrder: 100000,
  expiresAt: null,
};

beforeEach(() => {
  resetServiceMocks();
  resetOtpMocks();
  serviceStubs.userById = makeUserRow();
});

describe("notifyVoucherGranted", () => {
  test("mails the account address with the campaign inside", async () => {
    notifyVoucherGranted("customer-1", GRANT);
    await flush();
    expect(otpStubs.sent).toHaveLength(1);
    expect(otpStubs.sent[0].to).toBe("an@example.com");
    expect(otpStubs.sent[0].subject).toContain("khuyến mãi mới");
    expect(otpStubs.sent[0].body).toContain("Chao mung tai khoan moi");
  });

  test("stays silent when mail is not configured", async () => {
    otpStubs.mailConfigured = false;
    notifyVoucherGranted("customer-1", GRANT);
    await flush();
    expect(otpStubs.sent).toHaveLength(0);
  });

  test("stays silent without an account email and never throws", async () => {
    serviceStubs.userById = makeUserRow({ email: null });
    notifyVoucherGranted("customer-1", GRANT);
    await flush();
    expect(otpStubs.sent).toHaveLength(0);
    await expect(flush()).resolves.toBeUndefined();
  });
});
