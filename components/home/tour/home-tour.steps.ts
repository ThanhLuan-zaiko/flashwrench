import type { Tour } from "nextstepjs";
import { TOUR_STEP_OPTIONS } from "@/components/tour/tour-defaults";

// Single home onboarding tour. Selectors must match `data-tour`
// attributes rendered on the landing page. Steps stay in this pure
// module so unit tests can assert copy and anchors without rendering.
export const HOME_TOUR_NAME = "home-guide";

export const HOME_TOUR_STEPS: Tour[] = [
  {
    tour: HOME_TOUR_NAME,
    steps: [
      {
        selector: '[data-tour="booking-cta"]',
        title: "Đặt lịch trong một phút",
        content:
          "Bấm Đặt lịch ngay, chọn dịch vụ, khung giờ và địa điểm. Không cần tài khoản vẫn đặt được.",
        side: "bottom",
        ...TOUR_STEP_OPTIONS,
      },
      {
        selector: '[data-tour="services"]',
        title: "Xem trước dịch vụ và giá",
        content:
          "Mọi bệnh của xe, một nơi chữa: bảo dưỡng, sửa chữa lưu động và cứu hộ với giá minh bạch.",
        side: "bottom",
        ...TOUR_STEP_OPTIONS,
      },
      {
        selector: '[data-tour="how-it-works"]',
        title: "Ba bước là xong",
        content:
          "Đặt lịch, thợ xác thực tới tận nơi, nghiệm thu rồi mới thanh toán.",
        side: "bottom",
        ...TOUR_STEP_OPTIONS,
      },
      {
        selector: '[data-tour="rescue-cta"]',
        title: "Cứu hộ khẩn cấp 24/7",
        content:
          "Hỏng xe giữa đường? Gọi cứu hộ, thợ tới tận nơi bất kể ngày đêm.",
        side: "top",
        ...TOUR_STEP_OPTIONS,
      },
    ],
  },
];
