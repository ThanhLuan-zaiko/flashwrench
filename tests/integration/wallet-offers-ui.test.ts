// WalletPicker offers panel: primary ticket, disclosure count, and the
// always-rendered typed-code slot. Static markup — effects never run
// here, so auto-apply itself is covered by the nextAutoSelection unit
// tests.
import { describe, expect, test } from "bun:test";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement, type ReactElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { WalletOfferSections } from "@/components/vouchers/WalletOfferSections";
import { WalletPicker } from "@/components/vouchers/WalletPicker";
import { voucherKeys } from "@/hooks/useVouchers";
import type { VoucherWallet } from "@/lib/vouchers/voucher.types";
import type { ClaimableCodeCampaign } from "@/lib/vouchers/voucher-code.types";
import type { RankedWallet } from "@/lib/vouchers/voucher-offers";

const noop = () => undefined;

function makeWallet(
  overrides: Partial<VoucherWallet> & { id: string },
): VoucherWallet {
  return {
    userId: "customer-1",
    campaignId: "campaign-1",
    campaignCode: "CODE",
    campaignName: "Chao mung",
    imageUrl: "",
    discountType: "fixed",
    discountValue: 50000,
    maxDiscount: 0,
    scope: "all",
    minOrder: 0,
    status: "active",
    spendable: true,
    grantedAt: null,
    expiresAt: null,
    usedAt: null,
    usedOrderId: null,
    usedBookingId: null,
    ...overrides,
  };
}

function makeCode(
  overrides?: Partial<ClaimableCodeCampaign>,
): ClaimableCodeCampaign {
  return {
    campaignId: "c1",
    slug: "giam",
    name: "Giam gia",
    code: "GIAM20",
    discountType: "fixed",
    discountValue: 20000,
    maxDiscount: 0,
    minOrder: 0,
    endAt: null,
    ...overrides,
  };
}

function renderPicker(
  props: {
    value?: string | null;
    wallets?: VoucherWallet[];
    codes?: ClaimableCodeCampaign[];
    codeSlot?: ReactElement;
  } = {},
) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  if (props.wallets) {
    queryClient.setQueryData(["vouchers", "mine", null, 100], {
      items: props.wallets,
      nextCursor: null,
    });
  }
  if (props.codes) {
    queryClient.setQueryData(voucherKeys.claimable("booking"), props.codes);
  }
  const markup = renderToStaticMarkup(
    createElement(
      QueryClientProvider,
      { client: queryClient },
      createElement(WalletPicker, {
        kind: "booking",
        subtotal: 200000,
        value: props.value ?? null,
        showTotals: false,
        codeSlot:
          props.codeSlot ?? createElement("div", { "data-code-slot": true }),
        onChange: noop,
      }),
    ),
  );
  queryClient.clear();
  return markup;
}

function renderSections(
  element: ReactElement,
  seed?: (queryClient: QueryClient) => void,
) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  seed?.(queryClient);
  const markup = renderToStaticMarkup(
    createElement(QueryClientProvider, { client: queryClient }, element),
  );
  queryClient.clear();
  return markup;
}

describe("WalletPicker offers", () => {
  test("loading still shows the code slot", () => {
    const markup = renderPicker();
    expect(markup).toContain("Đang tải voucher");
    expect(markup).toContain("data-code-slot");
  });

  test("best usable wallet is primary with its badge and count", () => {
    const markup = renderPicker({
      wallets: [
        makeWallet({ id: "w-best", discountValue: 50000 }),
        makeWallet({ id: "w-alt", discountValue: 10000 }),
      ],
      codes: [],
    });
    expect(markup).toContain("Tiết kiệm nhất");
    expect(markup).toContain('aria-label="Áp dụng voucher Chao mung"');
    expect(markup).toContain("Xem thêm ưu đãi (1)");
    expect(markup).toContain("Ưu đãi cho lịch hẹn này");
  });

  test("a selected wallet shows Đang dùng and a remove button", () => {
    const markup = renderPicker({
      wallets: [makeWallet({ id: "w-best" })],
      value: "w-best",
    });
    expect(markup).toContain("Đang dùng");
    expect(markup).toContain('aria-label="Bỏ voucher Chao mung"');
  });

  test("a claimable code becomes the primary when nothing is usable", () => {
    const markup = renderPicker({ wallets: [], codes: [makeCode()] });
    expect(markup).toContain("Nhận &amp; áp dụng");
    expect(markup).toContain("Mã GIAM20");
    expect(markup).not.toContain("Xem thêm ưu đãi");
  });

  test("a near-miss wallet leads with its top-up hint", () => {
    const markup = renderPicker({
      wallets: [
        makeWallet({ id: "w-near", minOrder: 220000, discountValue: 50000 }),
      ],
      codes: [],
    });
    expect(markup).toContain("Thêm 20.000đ để dùng");
    expect(markup).not.toContain("Áp dụng voucher");
  });

  test("empty offers fall back to the empty copy and code slot", () => {
    const markup = renderPicker({ wallets: [], codes: [] });
    expect(markup).toContain("Chưa có voucher nào dùng được cho đơn này.");
    expect(markup).toContain("Xem ví voucher");
    expect(markup).toContain("data-code-slot");
  });

  test("an unspendable wallet never appears", () => {
    const markup = renderPicker({
      wallets: [
        makeWallet({
          id: "w-dead",
          spendable: false,
          campaignName: "Het han",
        }),
      ],
      codes: [],
    });
    expect(markup).not.toContain("Het han");
    expect(markup).toContain("Chưa có voucher nào dùng được cho đơn này.");
  });
});

describe("WalletOfferSections", () => {
  test("shows every section heading and the overflow dropdown label", () => {
    const usable = Array.from({ length: 6 }, (_, i) => ({
      wallet: makeWallet({ id: `w-${i}`, campaignId: `c-${i}` }),
      discount: 10000,
    })) satisfies RankedWallet[];
    const markup = renderSections(
      createElement(WalletOfferSections, {
        kind: "booking",
        subtotal: 200000,
        usable,
        near: [
          {
            wallet: makeWallet({
              id: "w-near",
              minOrder: 220000,
              campaignId: "c-near",
            }),
            shortfall: 20000,
            discount: 50000,
          },
        ],
        codes: [
          {
            campaign: makeCode(),
            discount: 20000,
            shortfall: 0,
          },
        ],
        value: null,
        onSelect: noop,
        onRemove: noop,
        onClaimed: noop,
      }),
    );
    expect(markup).toContain("Voucher khác trong ví");
    expect(markup).toContain("Sắp dùng được");
    expect(markup).toContain("Mã có thể nhận");
    expect(markup).toContain("Voucher khác (2)");
    expect(markup).toContain("Chọn voucher khác…");
    expect(markup).toContain("Thêm 20.000đ để dùng");
  });
});
