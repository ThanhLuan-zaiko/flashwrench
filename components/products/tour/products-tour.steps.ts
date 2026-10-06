import type { Tour } from "nextstepjs";
import { TOUR_STEP_OPTIONS } from "@/components/tour/tour-defaults";

// Single products onboarding tour doubling as the buying guide. Selectors
// must match `data-tour` attributes rendered on the /products landing.
// Steps stay in this pure module so unit tests can assert copy and
// anchors without rendering.
export const PRODUCTS_TOUR_NAME = "products-guide";

export const PRODUCTS_TOUR_STEPS: Tour[] = [
  {
    tour: PRODUCTS_TOUR_NAME,
    steps: [
      {
        selector: '[data-tour="products-filter"]',
        title: "Tìm đúng linh kiện",
        content:
          "Bấm danh mục hoặc gõ tên, hãng, mã SKU để lọc. Giá và tồn kho cập nhật trực tiếp.",
        side: "bottom",
        ...TOUR_STEP_OPTIONS,
      },
      {
        selector: '[data-tour="products-grid"]',
        title: "So sánh ngay trên thẻ",
        content:
          "Mỗi thẻ có giá, giá gốc và tồn kho. Bấm con mắt để xem nhanh hoặc Thêm vào giỏ để mua.",
        side: "top",
        ...TOUR_STEP_OPTIONS,
      },
      {
        selector: '[data-tour="products-cart-cta"]',
        title: "Chốt đơn trong giỏ hàng",
        content:
          "Chọn xong mở giỏ hàng để kiểm tra số lượng, áp voucher rồi đặt hàng — giao tận nơi hoặc nhận tại gara.",
        side: "top",
        ...TOUR_STEP_OPTIONS,
      },
    ],
  },
];
