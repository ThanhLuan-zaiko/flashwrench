// Questions customers ask before booking. Answers restate what the home page
// and booking flow already promise, so they stay true to the product copy.
export type HomeFaqItem = {
  question: string;
  answer: string;
};

export const HOME_FAQ: HomeFaqItem[] = [
  {
    question: "Tôi có cần tài khoản để đặt lịch không?",
    answer: "Không. Bạn có thể đặt lịch ngay, không cần tạo tài khoản trước.",
  },
  {
    question: "Thợ tới trong bao lâu sau khi đặt?",
    answer:
      "Thợ xác nhận yêu cầu trong vài phút và có mặt trong khoảng 30 phút.",
  },
  {
    question: "Cứu hộ có hoạt động ngoài giờ không?",
    answer:
      "Có. Cứu hộ khẩn cấp hoạt động 24/7, cả ban ngày lẫn ban đêm. Phí theo km và phụ phí ban đêm được hiển thị trước khi bạn xác nhận.",
  },
  {
    question: "Tôi có biết giá trước khi thợ làm việc không?",
    answer:
      "Có. Thợ báo giá trước khi bắt đầu. Bạn chỉ xác nhận khi đã đồng ý với mức giá đó.",
  },
  {
    question: "Phụ tùng có chính hãng không?",
    answer:
      "Phụ tùng hiển thị trên trang là hàng có sẵn trong kho và được ghi rõ thương hiệu, tên và giá trên từng sản phẩm.",
  },
];
