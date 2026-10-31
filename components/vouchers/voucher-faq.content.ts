// Customer Q&A about vouchers. One source for the visible FAQ on /vouchers
// and for the sổ tay steps, so the answer never drifts between the two.
export type VoucherFaqItem = {
  question: string;
  answer: string;
};

export const VOUCHER_FAQ: VoucherFaqItem[] = [
  {
    question: "Voucher 1.000.000đ nhưng đơn chỉ 700.000đ thì sao?",
    answer:
      "Bạn vẫn dùng được. Đơn này được giảm 700.000đ, phần còn lại 300.000đ vẫn nằm trong ví và tự áp cho đơn sau. Nếu hủy đơn, số tiền đã trừ được hoàn lại vào ví.",
  },
  {
    question: "Phần còn dư có hết hạn không?",
    answer:
      "Phần dư theo đúng hạn dùng của voucher và của chương trình. Hết hạn thì phần còn lại cũng hết hiệu lực.",
  },
  {
    question: "Có dùng được phần dư cho đơn nhỏ hơn không?",
    answer:
      "Có, nếu đơn đạt đơn tối thiểu của chương trình. Chương trình có đơn tối thiểu lớn thì đơn sau phải đạt mức đó mới dùng được phần còn lại.",
  },
  {
    question: "Voucher giảm theo phần trăm hoặc miễn phí công có dư không?",
    answer:
      "Không. Voucher giảm theo phần trăm và voucher miễn phí công chỉ dùng một lần cho một đơn.",
  },
];
