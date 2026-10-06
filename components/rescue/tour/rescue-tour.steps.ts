import type { Tour } from "nextstepjs";
import { TOUR_STEP_OPTIONS } from "@/components/tour/tour-defaults";

// Single rescue onboarding tour. Selectors must match `data-tour`
// attributes rendered inside RescueForm and RescueEntry. Steps stay in
// this pure module so unit tests can assert copy and anchors without
// rendering.
export const RESCUE_TOUR_NAME = "rescue-guide";

export const RESCUE_TOUR_STEPS: Tour[] = [
  {
    tour: RESCUE_TOUR_NAME,
    steps: [
      {
        selector: '[data-tour="rescue-contact"]',
        title: "Để lại cách liên hệ",
        content:
          "Điền họ tên và số điện thoại — thợ trực gọi lại số này ngay. Đã đăng nhập thì hệ thống tự điền.",
        side: "bottom",
        ...TOUR_STEP_OPTIONS,
      },
      {
        selector: '[data-tour="rescue-issue"]',
        title: "Chọn sự cố gần nhất",
        content:
          "Chọn tình huống giống nhất và mô tả thêm dấu hiệu xe để thợ mang đúng đồ nghề.",
        side: "bottom",
        ...TOUR_STEP_OPTIONS,
      },
      {
        selector: '[data-tour="rescue-location"]',
        title: "Ghim vị trí xe",
        content:
          "Chạm lên bản đồ để ghim nơi xe đang dừng hoặc gõ địa chỉ bên dưới — thợ tới đúng chỗ.",
        side: "bottom",
        ...TOUR_STEP_OPTIONS,
      },
      {
        selector: '[data-tour="rescue-submit"]',
        title: "Gửi và chờ cuộc gọi",
        content:
          "Kiểm tra lại biển số xe rồi bấm gửi — thợ trực 24/7 gọi lại trong vài phút.",
        side: "top",
        ...TOUR_STEP_OPTIONS,
      },
      {
        selector: '[data-tour="rescue-safety"]',
        title: "An toàn trước tiên",
        content:
          "Bật đèn cảnh báo, đứng nơi an toàn. Va chạm nặng hoặc kẹt trên cao tốc: gọi hotline ngay.",
        side: "top",
        ...TOUR_STEP_OPTIONS,
      },
    ],
  },
];
