import { describe, expect, test } from "bun:test";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement, type ReactElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { BookingPriceSummary } from "@/components/booking/BookingPriceSummary";
import { BookingServiceSection } from "@/components/booking/BookingServiceSection";
import { MechanicSection } from "@/components/booking/MechanicSection";
import { getBookingServiceSelection } from "@/lib/booking/booking-service-selection";
import { makeServiceItem } from "../helpers/catalog.fixtures";

// Regression for the /booking overlap: the old grid packed a sticky
// media column and the mechanic picker into the same grid column, so
// the pinned gallery slid over the picker while the fieldset's
// min-inline-size overflowed the form border. The checkout-style layout
// keeps the media in step 1's flow and the summary aside alone in its
// column.

const FIRST_ID = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const SECOND_ID = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";
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
const noop = () => undefined;

function render(element: ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const markup = renderToStaticMarkup(
    createElement(QueryClientProvider, { client: queryClient }, element),
  );
  queryClient.clear();
  return markup;
}

describe("booking layout overlap", () => {
  test("the mechanic fieldset shrinks inside its step card", () => {
    const markup = render(
      createElement(MechanicSection, {
        lat: null,
        lng: null,
        value: null,
        onChange: noop,
      }),
    );
    expect(markup).toMatch(/<fieldset[^>]*min-w-0/);
  });

  test("step 1 keeps the media in flow with a single service dropdown", () => {
    const markup = render(
      createElement(BookingServiceSection, {
        services,
        serviceIds: ids,
        selection: getBookingServiceSelection(ids, services),
        activeService: services[0],
        onServiceIds: noop,
        onInspect: noop,
      }),
    );
    expect(markup).not.toContain("sticky");
    expect(markup.match(/aria-haspopup="listbox"/g)).toHaveLength(1);
    expect(markup).toContain("Bước 1");
    expect(markup).not.toContain("Giá dịch vụ tạm tính");
    expect(markup).not.toContain("Chưa có phiếu nào dùng được");
  });

  test("the summary aside pins on lg and owns the submit button", () => {
    const markup = render(
      createElement(BookingPriceSummary, {
        serviceIds: ids,
        selection: getBookingServiceSelection(ids, services),
        guest: true,
        walletId: null,
        errors: {},
        pending: false,
        onWallet: noop,
      }),
    );
    expect(markup).toContain("lg:sticky");
    expect(markup).toContain('type="submit"');
  });
});
