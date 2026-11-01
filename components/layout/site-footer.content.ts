import { RESCUE_HOTLINE } from "@/components/rescue/rescue-constants";

// Copy and links for the site footer. Every href is an existing app route.
export type FooterLink = {
  label: string;
  href: string;
};

export type FooterColumn = {
  title: string;
  links: FooterLink[];
};

export const FOOTER_PHRASES: { id: string; text: string }[] = [
  "Sửa xe lưu động",
  "Cứu hộ 24/7",
  "Phụ tùng sẵn kho",
  "Báo giá trước khi làm",
  "Thợ đã xác thực",
].map((text) => ({ id: text, text }));

export const FOOTER_COLUMNS: FooterColumn[] = [
  {
    title: "Dịch vụ",
    links: [
      { label: "Dịch vụ sửa xe", href: "/services" },
      { label: "Cứu hộ khẩn cấp", href: "/rescue" },
      { label: "Đặt lịch sửa xe", href: "/booking" },
    ],
  },
  {
    title: "Mua sắm",
    links: [
      { label: "Phụ tùng", href: "/products" },
      { label: "Ưu đãi đang chạy", href: "/vouchers" },
      { label: "Giỏ hàng", href: "/cart" },
    ],
  },
  {
    title: "Tài khoản",
    links: [
      { label: "Đăng nhập", href: "/login" },
      { label: "Đăng ký", href: "/register" },
      { label: "Tra cứu đơn", href: "/lookup" },
    ],
  },
];

export const FOOTER_HOTLINE = {
  label: "Hotline cứu hộ",
  number: RESCUE_HOTLINE,
  href: `tel:${RESCUE_HOTLINE.replace(/\s/g, "")}`,
};
