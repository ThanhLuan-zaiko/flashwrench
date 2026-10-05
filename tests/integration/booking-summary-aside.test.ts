import { describe, expect, test } from "bun:test";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement, type ReactElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { BookingPriceSummary } from "@/components/booking/BookingPriceSummary";
import { SelectedServiceLines } from "@/components/booking/SelectedServiceLines";
import { authKeys } from "@/hooks/auth";
import { getBookingServiceSelection } from "@/lib/booking/booking-service-selection";
import { makeServiceItem } from "../helpers/catalog.fixtures";

// The checkout-style summary aside: totals, the voucher picker and the
// confirm button for the booking form. Each scenario renders the aside
// in isolation with the selection the form would compute.

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
  queryClient.setQueryData(authKeys.me, { user: null, status: "active" });
  const markup = renderToStaticMarkup(
    createElement(QueryClientProvider, { client: queryClient }, element),
  );
  queryClient.clear();
  return markup;
}

describe("booking summary aside", () => {
  test("discloses unit-based pricing and one visit's additional fees", () => {
    const hourlyCatalog = [
      services[0],
      makeServiceItem({
        id: SECOND_ID,
        name: "Kiểm tra phanh",
        basePrice: 101000,
        durationMin: 30,
        priceUnit: "per_hour",
      }),
    ];
    const markup = render(
      createElement(BookingPriceSummary, {
        serviceIds: ids,
        selection: getBookingServiceSelection(ids, hourlyCatalog),
        guest: true,
        walletId: null,
        errors: {},
        pending: false,
        voucherCode: "",
        onWallet: noop,
        onVoucherCode: noop,
      }),
    );
    expect(markup).toContain("Tóm tắt lịch hẹn");
    expect(markup).toContain("300.000đ");
    expect(markup).toContain("90 phút");
    expect(markup).toContain("1 đơn vị");
    expect(markup).toContain("cho cả lịch hẹn");
    expect(markup).toContain("2 dịch vụ trong một lịch hẹn");
    expect(markup).not.toContain('disabled=""');
  });

  test("blocks confirmation until step 1 is valid", () => {
    const empty = render(
      createElement(BookingPriceSummary, {
        serviceIds: [],
        selection: getBookingServiceSelection([], services),
        guest: true,
        walletId: null,
        errors: {},
        pending: false,
        voucherCode: "",
        onWallet: noop,
        onVoucherCode: noop,
      }),
    );
    expect(empty).toContain("Chọn ít nhất một dịch vụ ở bước 1");
    expect(empty).toContain('disabled=""');

    const issue = render(
      createElement(BookingPriceSummary, {
        serviceIds: ids,
        selection: getBookingServiceSelection(ids, services.slice(0, 1)),
        guest: true,
        walletId: null,
        errors: {},
        pending: false,
        voucherCode: "",
        onWallet: noop,
        onVoucherCode: noop,
      }),
    );
    expect(issue).toContain("Hãy xử lý cảnh báo ở bước 1");
    expect(issue).toContain('disabled=""');
  });

  test("points to fields that still need fixing", () => {
    const selection = getBookingServiceSelection(ids, services);
    const fieldError = render(
      createElement(BookingPriceSummary, {
        serviceIds: ids,
        selection,
        guest: true,
        walletId: null,
        errors: { vehiclePlate: "x" },
        pending: false,
        voucherCode: "",
        onWallet: noop,
        onVoucherCode: noop,
      }),
    );
    expect(fieldError).toContain(
      "Vui lòng kiểm tra lại các ô được đánh dấu đỏ.",
    );

    const formError = render(
      createElement(BookingPriceSummary, {
        serviceIds: ids,
        selection,
        guest: true,
        walletId: null,
        errors: { form: "Khung giờ này đã kín." },
        pending: false,
        voucherCode: "",
        onWallet: noop,
        onVoucherCode: noop,
      }),
    );
    expect(formError).toContain("Khung giờ này đã kín.");
  });

  test("customers pick the voucher inside the summary", () => {
    const markup = render(
      createElement(BookingPriceSummary, {
        serviceIds: ids,
        selection: getBookingServiceSelection(ids, services),
        guest: false,
        walletId: null,
        errors: {},
        pending: false,
        voucherCode: "",
        onWallet: noop,
        onVoucherCode: noop,
      }),
    );
    expect(markup).toContain("Đang tải voucher");
    expect(markup).toContain("Tổng tạm tính");
  });

  test("each selected line carries a media toggle marked for the previewed service", () => {
    const markup = render(
      createElement(SelectedServiceLines, {
        serviceIds: ids,
        services,
        activeId: FIRST_ID,
        onRemove: noop,
        onInspect: noop,
      }),
    );
    expect(markup.match(/aria-label="Xem hình ảnh và đánh giá/g)).toHaveLength(
      2,
    );
    expect(markup.match(/aria-pressed="true"/g)).toHaveLength(1);
    expect(markup.match(/aria-pressed="false"/g)).toHaveLength(1);
    expect(markup.match(/Bỏ chọn/g)).toHaveLength(2);
  });
});
