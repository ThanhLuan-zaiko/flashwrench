import { VOUCHER_FAQ } from "@/components/vouchers/voucher-faq.content";
import type { GuideTour } from "./tour-adapt";
import { TOUR_STEP_OPTIONS } from "./tour-defaults";

// Customer "sổ tay". Two guides share the root provider and run on every
// screen size:
// - customer-guide walks /services → /booking → /vouchers. The booking form
//   is a one-step-at-a-time wizard below the lg breakpoint, so each booking
//   step names the wizard step that shows its section (wizardStep).
// - vouchers-guide starts on /vouchers and ends with the Q&A items, one step
//   per question. Routes between pages are derived by tour-adapt.
// Selectors must match data-tour attributes on those pages.
export const CUSTOMER_GUIDE_NAME = "customer-guide";
export const VOUCHERS_GUIDE_NAME = "vouchers-guide";

// Wizard step indexes in BookingForm: services, location and time, contact,
// vehicle and confirm (the summary shows on the last one).
const WIZARD_SERVICES = 0;
const WIZARD_LOCATION_TIME = 1;
const WIZARD_VEHICLE = 3;

const VOUCHERS_FAQ_STEPS = VOUCHER_FAQ.map((item, index) => ({
  selector: `[data-tour="vouchers-faq-${index}"]`,
  title: `Hỏi đáp · ${item.question}`,
  content: item.answer,
  side: "top" as const,
  page: "/vouchers",
  ...TOUR_STEP_OPTIONS,
}));

export const CUSTOMER_GUIDE_STEPS: GuideTour[] = [
  {
    tour: CUSTOMER_GUIDE_NAME,
    steps: [
      {
        selector: '[data-tour="guide-services"]',
        title: "Bước 1 · Chọn dịch vụ",
        content:
          "Tìm dịch vụ bạn cần ở đây. Có thể chọn nhiều dịch vụ rồi đặt lịch một lần.",
        side: "bottom",
        page: "/services",
        ...TOUR_STEP_OPTIONS,
      },
      {
        selector: '[data-tour="booking-services"]',
        title: "Bước 2 · Kiểm tra dịch vụ",
        content: "Dịch vụ đã chọn hiện ở đây. Thêm hoặc bỏ trước khi đặt lịch.",
        side: "bottom",
        page: "/booking",
        wizardStep: WIZARD_SERVICES,
        ...TOUR_STEP_OPTIONS,
      },
      {
        selector: '[data-tour="booking-details"]',
        title: "Bước 3 · Chọn địa điểm và giờ",
        content:
          "Ghim nơi cần sửa xe, rồi chọn khung giờ thợ tới. Trên điện thoại, bấm Tiếp tục để đi tiếp các bước.",
        side: "bottom",
        page: "/booking",
        wizardStep: WIZARD_LOCATION_TIME,
        ...TOUR_STEP_OPTIONS,
      },
      {
        selector: '[data-tour="booking-vehicle"]',
        title: "Bước 4 · Thông tin xe",
        content:
          "Nhập biển số và hãng xe để thợ chuẩn bị đúng đồ nghề. Trên điện thoại, bước này nằm trước phần xác nhận.",
        side: "bottom",
        page: "/booking",
        wizardStep: WIZARD_VEHICLE,
        ...TOUR_STEP_OPTIONS,
      },
      {
        selector: '[data-tour="booking-summary"]',
        title: "Bước 5 · Xem tạm tính",
        content:
          "Tổng tiền và voucher áp dụng hiện ở đây. Khi đã sẵn sàng, bấm xác nhận đặt lịch.",
        // Left of the aside on wide screens: below it the card would run past
        // the bottom of the page.
        side: "left",
        page: "/booking",
        wizardStep: WIZARD_VEHICLE,
        ...TOUR_STEP_OPTIONS,
      },
      {
        selector: '[data-tour="vouchers-header"]',
        title: "Bước 6 · Ví voucher của bạn",
        content:
          "Voucher nhận được nằm trong ví này. Voucher giảm cố định còn dư vẫn được dùng cho đơn sau.",
        side: "bottom",
        page: "/vouchers",
        ...TOUR_STEP_OPTIONS,
      },
      {
        selector: '[data-tour="vouchers-campaigns"]',
        title: "Bước 7 · Nhận thêm ưu đãi",
        content:
          "Các chương trình đang chạy và cách nhận. Đăng nhập để được phát tự động khi đủ điều kiện.",
        // Tall target: a card above it would sit past the top of the page.
        side: "bottom",
        page: "/vouchers",
        ...TOUR_STEP_OPTIONS,
      },
    ],
  },
  {
    tour: VOUCHERS_GUIDE_NAME,
    steps: [
      {
        selector: '[data-tour="vouchers-header"]',
        title: "Ví voucher của bạn",
        content:
          "Mỗi voucher gắn với tài khoản này. Ví tự cập nhật khi có voucher mới.",
        side: "bottom",
        page: "/vouchers",
        ...TOUR_STEP_OPTIONS,
      },
      {
        selector: '[data-tour="vouchers-campaigns"]',
        title: "Cách nhận ưu đãi",
        content:
          "Các chương trình đang chạy. Đăng nhập để được phát tự động khi đủ điều kiện.",
        side: "bottom",
        page: "/vouchers",
        ...TOUR_STEP_OPTIONS,
      },
      ...VOUCHERS_FAQ_STEPS,
    ],
  },
];
