import { describe, expect, test } from "bun:test";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement, type ReactElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { BookingDuration } from "@/components/booking/BookingDuration";
import { BookingSubmitButton } from "@/components/booking/BookingSubmitButton";
import { BookingSuccess } from "@/components/booking/BookingSuccess";
import { SelectedServiceLines } from "@/components/booking/SelectedServiceLines";
import { PublicServiceCard } from "@/components/services/PublicServiceCard";
import { ServicesSelectionBar } from "@/components/services/ServicesSelectionBar";
import { VoucherTotals } from "@/components/vouchers/VoucherTotals";
import { authKeys } from "@/hooks/auth";
import { buildBookingHref } from "@/lib/auth/auth-redirect";
import { getBookingServiceSelection } from "@/lib/booking/booking-service-selection";
import { makeBookingServiceSnapshot } from "../helpers/booking.fixtures";
import { makeServiceItem } from "../helpers/catalog.fixtures";
import { okCreatedBooking } from "../helpers/route.fixtures";

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

describe("multi-service booking interface", () => {
  test("renders every selected service, its price and an accessible remove action", () => {
    const markup = render(
      createElement(SelectedServiceLines, {
        serviceIds: ids,
        services,
        onRemove: noop,
      }),
    );
    expect(markup).toContain("Thay dầu động cơ");
    expect(markup).toContain("Kiểm tra phanh");
    expect(markup).toContain("199.000đ");
    expect(markup).toContain("101.000đ");
    expect(markup.match(/aria-label="Bỏ chọn/g)).toHaveLength(2);
  });

  test("marks a selected card without an individual checkout shortcut", () => {
    const markup = render(
      createElement(PublicServiceCard, {
        service: services[0],
        selected: true,
        disabledReason: null,
        onToggle: noop,
      }),
    );
    expect(markup).toContain('aria-pressed="true"');
    expect(markup).toContain("Đã thêm · Bỏ chọn");
    expect(markup.match(/<button\b/g)).toHaveLength(1);
    expect(markup).not.toContain('href="/booking');
    expect(markup).not.toContain("Đặt dịch vụ");
    expect(markup).toContain("dark:border-zinc-100");
  });

  test("an unselected card offers one immediate add action rather than checkout", () => {
    const markup = render(
      createElement(PublicServiceCard, {
        service: services[0],
        selected: false,
        disabledReason: null,
        onToggle: noop,
      }),
    );
    expect(markup).toContain('aria-pressed="false"');
    expect(markup).toContain("Thêm vào lịch hẹn");
    expect(markup).toContain('aria-label="Thêm Thay dầu động cơ vào lịch hẹn"');
    expect(markup.match(/<button\b/g)).toHaveLength(1);
    expect(markup).not.toContain('href="/booking');
    expect(markup).not.toContain("Đang kiểm tra đăng nhập");
  });

  test("incompatible additions stay disabled while selected services remain removable", () => {
    const renderCard = (selected: boolean) =>
      render(
        createElement(PublicServiceCard, {
          service: services[0],
          selected,
          disabledReason: "Hãy đặt riêng dịch vụ này.",
          onToggle: noop,
        }),
      );
    const unselected = renderCard(false);
    expect(unselected).toMatch(/<button[^>]* disabled=""/);
    expect(unselected).toContain("Hãy đặt riêng dịch vụ này.");
    expect(unselected).not.toContain('href="/booking');
    const selected = renderCard(true);
    expect(selected).not.toMatch(/<button[^>]* disabled=""/);
    expect(selected).toContain('aria-label="Bỏ chọn Thay dầu động cơ"');
  });

  test("the catalog offers only one checkout link containing the complete selection", () => {
    const markup = render(
      createElement(
        "div",
        null,
        ...services.map((service) =>
          createElement(PublicServiceCard, {
            key: service.id,
            service,
            selected: true,
            disabledReason: null,
            onToggle: noop,
          }),
        ),
        createElement(ServicesSelectionBar, {
          serviceIds: ids,
          selection: getBookingServiceSelection(ids, services),
          ready: true,
          onRemove: noop,
          onClear: noop,
        }),
      ),
    );
    expect(markup).toContain("Đã chọn 2 dịch vụ");
    expect(markup).toContain("300.000đ");
    expect(markup).toContain("90 phút");
    expect(markup).toContain(buildBookingHref(ids));
    expect(markup.match(/href="\/booking[^"]*"/g)).toHaveLength(1);
    expect(markup).not.toContain(buildBookingHref(FIRST_ID));
    expect(markup).not.toContain(buildBookingHref(SECOND_ID));
    expect(markup).toContain("Tiếp tục đặt lịch");
  });

  test("a single service uses the same selection-bar checkout", () => {
    const selected = [FIRST_ID];
    const markup = render(
      createElement(ServicesSelectionBar, {
        serviceIds: selected,
        selection: getBookingServiceSelection(selected, services),
        ready: true,
        onRemove: noop,
        onClear: noop,
      }),
    );
    expect(markup).toContain("Đã chọn 1 dịch vụ");
    expect(markup).toContain("199.000đ");
    expect(markup).toContain(buildBookingHref(FIRST_ID));
    expect(markup.match(/href="\/booking[^"]*"/g)).toHaveLength(1);
    expect(markup).toContain("Tiếp tục đặt lịch");
  });

  test("blocks checkout when a selected service is unavailable", () => {
    const markup = render(
      createElement(ServicesSelectionBar, {
        serviceIds: ids,
        selection: getBookingServiceSelection(ids, services.slice(0, 1)),
        ready: true,
        onRemove: noop,
        onClear: noop,
      }),
    );
    expect(markup).toContain("Dịch vụ không còn khả dụng");
    expect(markup).toContain("disabled");
    expect(markup).not.toContain('href="/booking');
  });

  test("hides the selection bar when the draft is empty", () => {
    expect(
      render(
        createElement(ServicesSelectionBar, {
          serviceIds: [],
          selection: getBookingServiceSelection([], services),
          ready: true,
          onRemove: noop,
          onClear: noop,
        }),
      ),
    ).toBe("");
  });

  test("shows the subtotal, voucher and final price without multiplying the travel fee", () => {
    const markup = render(
      createElement(VoucherTotals, {
        subtotal: 300000,
        discount: 50000,
        travelFee: 20000,
      }),
    );
    expect(markup).toContain("300.000đ");
    expect(markup).toContain("50.000đ");
    expect(markup).toContain("270.000đ");
    expect(markup.match(/Phí di chuyển/g)).toHaveLength(1);
  });

  test("makes the confirmation action explicit about one appointment", () => {
    const markup = render(
      createElement(BookingSubmitButton, { pending: false, serviceCount: 2 }),
    );
    expect(markup).toContain("2 dịch vụ trong một lịch hẹn");
    expect(
      render(
        createElement(BookingSubmitButton, { pending: false, disabled: true }),
      ),
    ).toContain("disabled");
  });

  test("keeps old bookings free of a guessed duration", () => {
    expect(render(createElement(BookingDuration, { durationMin: null }))).toBe(
      "",
    );
    expect(
      render(createElement(BookingDuration, { durationMin: 180 })),
    ).toContain("3 giờ");
  });

  test("guest confirmation keeps a public tracking link while navigation completes", () => {
    const booking = okCreatedBooking();
    const markup = render(
      createElement(BookingSuccess, { booking, guest: true }),
    );
    expect(markup).toContain(`/track/booking/${booking.bookingId}`);
    expect(markup).toContain("Theo dõi lịch hẹn");
    expect(markup).not.toContain('href="/account"');
    expect(markup).toContain("<h1");
  });

  test("the success summary contains every booked item and the actual discount", () => {
    const booking = okCreatedBooking();
    booking.serviceIds = ids;
    booking.items = [
      makeBookingServiceSnapshot(),
      makeBookingServiceSnapshot({
        serviceId: SECOND_ID,
        serviceName: "Kiểm tra phanh",
        unitPrice: 101000,
        lineTotal: 101000,
        durationMin: 30,
      }),
    ];
    booking.subtotal = 300000;
    booking.discount = 50000;
    booking.total = 250000;
    booking.durationMin = 90;
    const markup = render(createElement(BookingSuccess, { booking }));
    expect(markup).toContain("Thay dầu động cơ");
    expect(markup).toContain("Kiểm tra phanh");
    expect(markup).toContain("50.000đ");
    expect(markup).toContain("250.000đ");
  });
});
