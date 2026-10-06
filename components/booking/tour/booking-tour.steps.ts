import type { Tour } from "nextstepjs";
import { TOUR_STEP_OPTIONS } from "@/components/tour/tour-defaults";

// Single booking onboarding tour. Selectors must match `data-tour`
// attributes on the numbered step cards inside BookingForm. Steps stay in
// this pure module so unit tests can assert copy and anchors without
// rendering.
export const BOOKING_TOUR_NAME = "booking-guide";

export const BOOKING_TOUR_STEPS: Tour[] = [
  {
    tour: BOOKING_TOUR_NAME,
    steps: [
      {
        selector: '[data-tour="booking-services"]',
        title: "Kiểm tra dịch vụ đã chọn",
        content:
          "Dịch vụ bạn chọn từ trang Dịch vụ nằm ở đây. Thêm hoặc bỏ tùy ý trước khi đặt.",
        side: "bottom",
        ...TOUR_STEP_OPTIONS,
      },
      {
        selector: '[data-tour="booking-location"]',
        title: "Ghim địa điểm sửa xe",
        content:
          "Chạm lên bản đồ để ghim vị trí hoặc gõ địa chỉ — thợ sẽ tới đúng chỗ này.",
        side: "bottom",
        ...TOUR_STEP_OPTIONS,
      },
      {
        selector: '[data-tour="booking-details"]',
        title: "Chọn khung giờ và xe",
        content:
          "Đặt thời gian thợ tới và điền biển số, hãng xe để thợ chuẩn bị đồ nghề.",
        side: "bottom",
        ...TOUR_STEP_OPTIONS,
      },
      {
        selector: '[data-tour="booking-contact"]',
        title: "Liên hệ hoặc chọn thợ",
        content:
          "Khách điền họ tên, số điện thoại và email. Đã đăng nhập thì bạn có thể tự chọn thợ.",
        side: "top",
        ...TOUR_STEP_OPTIONS,
      },
      {
        selector: '[data-tour="booking-summary"]',
        title: "Xem tạm tính rồi xác nhận",
        content:
          "Kiểm tra tổng tiền, nhập voucher nếu có rồi bấm xác nhận. Phụ tùng phát sinh được báo riêng.",
        side: "top",
        ...TOUR_STEP_OPTIONS,
      },
    ],
  },
];
