// Voucher code UI: the shared typed-code field in both modes, plus the
// per-viewer code block on the public campaign page. Static markup with
// seeded query caches — no server needed.
import { describe, expect, test } from "bun:test";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement, type ReactElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { BookingPriceSummary } from "@/components/booking/BookingPriceSummary";
import { CheckoutExtras } from "@/components/checkout/CheckoutExtras";
import { CampaignRedeemCode } from "@/components/promotions/CampaignRedeemCode";
import { VoucherCodeField } from "@/components/vouchers/VoucherCodeField";
import {
  campaignDetailHref,
  walletDetailHref,
} from "@/components/vouchers/voucher-detail-href";
import { authKeys } from "@/hooks/auth";
import { voucherKeys } from "@/hooks/useVouchers";
import { buildBookingHref, buildLoginHref } from "@/lib/auth/auth-redirect";
import { getBookingServiceSelection } from "@/lib/booking/booking-service-selection";
import { makePublicUser } from "../helpers/auth.fixtures";
import { makeServiceItem } from "../helpers/catalog.fixtures";

const noop = () => undefined;

const FIRST_ID = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const SECOND_ID = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";
const WALLET_ID = "dddddddd-dddd-4ddd-8ddd-dddddddddddd";
const SLUG = "chao-mung";
const ids = [FIRST_ID, SECOND_ID];
const services = [
  makeServiceItem({
    id: FIRST_ID,
    name: "Thay dầu động cơ",
    basePrice: 199000,
    durationMin: 60,
  }),
  makeServiceItem({
    id: SECOND_ID,
    name: "Kiểm tra phanh",
    basePrice: 101000,
    durationMin: 30,
  }),
];

function render(
  element: ReactElement,
  seed?: (queryClient: QueryClient) => void,
) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  queryClient.setQueryData(authKeys.me, { user: null, status: "active" });
  seed?.(queryClient);
  const markup = renderToStaticMarkup(
    createElement(QueryClientProvider, { client: queryClient }, element),
  );
  queryClient.clear();
  return markup;
}

function seedCustomer(queryClient: QueryClient) {
  queryClient.setQueryData(authKeys.me, {
    user: makePublicUser({ role: "customer" }),
    status: "active",
  });
}

function codeField(props: Partial<Parameters<typeof VoucherCodeField>[0]>) {
  return createElement(VoucherCodeField, {
    kind: "booking",
    subtotal: 300000,
    value: "",
    onValueChange: noop,
    onApplied: noop,
    ...props,
  });
}

describe("VoucherCodeField", () => {
  test("customer mode disables an empty apply button", () => {
    const markup = render(codeField({}));
    expect(markup).toContain('type="button"');
    expect(markup).toContain(">Áp dụng</button>");
    expect(markup).toContain('disabled=""');
    expect(markup).toContain("Mã voucher");
  });

  test("a typed code enables the button", () => {
    const markup = render(codeField({ value: "GIAM50K" }));
    const button = markup.slice(markup.indexOf("<button"));
    expect(button).not.toContain('disabled=""');
  });

  test("the input carries the mobile-friendly attributes", () => {
    const markup = render(codeField({ value: "GIAM50K" }));
    expect(markup).toContain('autoComplete="off"');
    expect(markup).toContain('maxLength="24"');
  });

  test("guest mode shows the login link and hides apply", () => {
    const href = buildLoginHref("/booking?services=x");
    const markup = render(codeField({ loginHref: href, value: "GIAM50K" }));
    expect(markup).toContain(`href="${href.replace(/&/g, "&amp;")}"`);
    expect(markup).toContain("Đăng nhập để áp dụng");
    expect(markup).toContain("Voucher gắn với tài khoản");
    expect(markup).not.toContain(">Áp dụng</button>");
  });
});

describe("BookingPriceSummary voucher code", () => {
  test("guest and ready shows the login link, not the old hint", () => {
    const markup = render(
      createElement(BookingPriceSummary, {
        serviceIds: ids,
        selection: getBookingServiceSelection(ids, services),
        guest: true,
        walletId: null,
        voucherCode: "",
        errors: {},
        pending: false,
        onWallet: noop,
        onVoucherCode: noop,
      }),
    );
    expect(markup).toContain("Mã voucher");
    expect(markup).toContain("Đăng nhập để áp dụng");
    expect(markup).toContain(
      buildLoginHref(buildBookingHref(ids)).replace(/&/g, "&amp;"),
    );
    expect(markup).not.toContain("Đăng nhập để dùng voucher trong ví của bạn.");
  });
});

describe("CheckoutExtras voucher code", () => {
  const base = {
    fieldId: "checkout",
    subtotal: 300000,
    walletId: null,
    note: "",
    disabled: false,
    onWallet: noop,
    onNote: noop,
  };

  test("customers get the typed-code field", () => {
    const markup = render(
      createElement(CheckoutExtras, { ...base, guest: false }),
    );
    expect(markup).toContain("Mã voucher");
  });

  test("guests keep the signup incentive without the field", () => {
    const markup = render(
      createElement(CheckoutExtras, { ...base, guest: true }),
    );
    expect(markup).not.toContain("Mã voucher");
    expect(markup).toContain("Tạo tài khoản để nhận voucher");
  });
});

describe("CampaignRedeemCode", () => {
  test("campaigns without a code render nothing", () => {
    expect(
      render(
        createElement(CampaignRedeemCode, {
          slug: SLUG,
          hasRedeemCode: false,
        }),
      ),
    ).toBe("");
  });

  test("guests see the login teaser", () => {
    const markup = render(
      createElement(CampaignRedeemCode, { slug: SLUG, hasRedeemCode: true }),
    );
    expect(markup).toContain("Đăng nhập để xem mã");
    expect(markup).toContain(
      `href="${buildLoginHref(campaignDetailHref(SLUG)).replace(/&/g, "&amp;")}"`,
    );
  });

  test("claimable customers see the code and a copy button", () => {
    const markup = render(
      createElement(CampaignRedeemCode, { slug: SLUG, hasRedeemCode: true }),
      (qc) => {
        seedCustomer(qc);
        qc.setQueryData(voucherKeys.campaignCode(SLUG), {
          status: "claimable",
          code: "GIAM50K",
        });
      },
    );
    expect(markup).toContain("GIAM50K");
    expect(markup).toContain("Sao chép mã");
  });

  test("owners get a link to the wallet they hold", () => {
    const markup = render(
      createElement(CampaignRedeemCode, { slug: SLUG, hasRedeemCode: true }),
      (qc) => {
        seedCustomer(qc);
        qc.setQueryData(voucherKeys.campaignCode(SLUG), {
          status: "owned",
          walletId: WALLET_ID,
        });
      },
    );
    expect(markup).toContain(walletDetailHref(WALLET_ID));
    expect(markup).toContain("Xem voucher");
  });

  test("at-limit customers see the cap notice", () => {
    const markup = render(
      createElement(CampaignRedeemCode, { slug: SLUG, hasRedeemCode: true }),
      (qc) => {
        seedCustomer(qc);
        qc.setQueryData(voucherKeys.campaignCode(SLUG), { status: "limit" });
      },
    );
    expect(markup).toContain("đủ số lượt");
  });
});
