// Redeem codes on the /vouchers shelf cards: customers see claimable
// codes, guests see a login teaser on coded campaigns, staff and
// ineligible customers see nothing. Static markup with seeded caches.
import { describe, expect, test } from "bun:test";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement, type ReactElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { PromoCampaignGrid } from "@/components/promotions/PromoCampaignGrid";
import { authKeys } from "@/hooks/auth";
import { voucherKeys } from "@/hooks/useVouchers";
import { buildLoginHref } from "@/lib/auth/auth-redirect";
import type { PublicUser } from "@/lib/auth/user.types";
import type { PublicVoucherCampaign } from "@/lib/vouchers/voucher.types";
import type { ClaimableCodeCampaign } from "@/lib/vouchers/voucher-code.types";
import { makePublicUser } from "../helpers/auth.fixtures";

const CAMPAIGN_ID = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";

function makeCampaign(
  overrides?: Partial<PublicVoucherCampaign>,
): PublicVoucherCampaign {
  return {
    id: CAMPAIGN_ID,
    slug: "chao-mung",
    name: "Chao mung",
    description: "",
    imageUrl: "",
    images: [],
    discountType: "fixed",
    discountValue: 50000,
    maxDiscount: 0,
    minOrder: 0,
    scope: "all",
    startAt: null,
    endAt: null,
    totalLimit: 0,
    grantedCount: 0,
    earn: [],
    hasRedeemCode: true,
    ...overrides,
  };
}

function makeCode(
  overrides?: Partial<ClaimableCodeCampaign>,
): ClaimableCodeCampaign {
  return {
    campaignId: CAMPAIGN_ID,
    slug: "chao-mung",
    name: "Chao mung",
    code: "GIAM50K",
    discountType: "fixed",
    discountValue: 50000,
    maxDiscount: 0,
    minOrder: 0,
    endAt: null,
    ...overrides,
  };
}

function render(
  element: ReactElement,
  seed?: (queryClient: QueryClient) => void,
) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  queryClient.setQueryData(authKeys.me, { user: null, status: "active" });
  queryClient.setQueryData(voucherKeys.public, [makeCampaign()]);
  seed?.(queryClient);
  const markup = renderToStaticMarkup(
    createElement(QueryClientProvider, { client: queryClient }, element),
  );
  queryClient.clear();
  return markup;
}

function seedUser(queryClient: QueryClient, user: PublicUser | null) {
  queryClient.setQueryData(authKeys.me, { user, status: "active" });
}

const grid = (showCodes = true) =>
  createElement(PromoCampaignGrid, { showCodes });

describe("PromoCampaignGrid redeem codes", () => {
  test("a customer sees the claimable code and the copy button", () => {
    const markup = render(grid(), (qc) => {
      seedUser(qc, makePublicUser({ role: "customer" }));
      qc.setQueryData(voucherKeys.claimable("all"), [makeCode()]);
    });
    expect(markup).toContain("Mã của bạn");
    expect(markup).toContain("GIAM50K");
    expect(markup).toContain("Sao chép mã");
  });

  test("a customer whose campaign is not claimable sees nothing", () => {
    const markup = render(grid(), (qc) => {
      seedUser(qc, makePublicUser({ role: "customer" }));
      qc.setQueryData(voucherKeys.claimable("all"), []);
    });
    expect(markup).not.toContain("Mã của bạn");
    expect(markup).not.toContain("Đăng nhập để xem mã");
  });

  test("a guest gets the login teaser on a coded campaign", () => {
    const markup = render(grid());
    expect(markup).toContain("Chương trình có mã ưu đãi riêng");
    expect(markup).toContain("Đăng nhập để xem mã");
    expect(markup).toContain(
      `href="${buildLoginHref("/vouchers").replace(/&/g, "&amp;")}"`,
    );
  });

  test("a guest sees no teaser when the campaign has no code", () => {
    const markup = render(grid(), (qc) => {
      qc.setQueryData(voucherKeys.public, [
        makeCampaign({ hasRedeemCode: false }),
      ]);
    });
    expect(markup).not.toContain("Đăng nhập để xem mã");
    expect(markup).not.toContain("Chương trình có mã ưu đãi riêng");
  });

  test("staff see nothing extra even on a coded campaign", () => {
    const markup = render(grid(), (qc) => {
      seedUser(qc, makePublicUser({ role: "dispatcher" }));
      qc.setQueryData(voucherKeys.claimable("all"), [makeCode()]);
    });
    expect(markup).not.toContain("Mã của bạn");
    expect(markup).not.toContain("Đăng nhập để xem mã");
  });

  test("showCodes off never renders the code UI", () => {
    const markup = render(grid(false), (qc) => {
      seedUser(qc, makePublicUser({ role: "customer" }));
      qc.setQueryData(voucherKeys.claimable("all"), [makeCode()]);
    });
    expect(markup).not.toContain("Mã của bạn");
    expect(markup).not.toContain("Đăng nhập để xem mã");
  });
});
