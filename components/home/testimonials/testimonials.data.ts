// Curated customer quotes for the home page wall. Exactly seven entries:
// one hero quote, two wide quotes and four compact ones fill the
// lg:grid-cols-4 bento without gaps.
export type Testimonial = {
  id: string;
  customerName: string;
  serviceLabel: string;
  rating: number;
  quote: string;
};

export const TESTIMONIAL_HERO_INDEX = 0;
export const TESTIMONIAL_WIDE_INDEXES = [1, 2];
export const TESTIMONIAL_COUNT = 7;

export const TESTIMONIALS: Testimonial[] = [
  {
    id: "hero",
    customerName: "Anh Minh Quân",
    serviceLabel: "Cứu hộ 24/7",
    rating: 5,
    quote:
      "Xe chết máy giữa cầu lúc 11 giờ đêm, tôi bấm gọi cứu hộ thử cho biết. Thợ gọi lại trong vòng một phút, tới nơi nhanh hơn cả thời gian hệ thống báo, thay ắc quy xong còn kiểm tra giúp hệ thống sạc. Lần đầu thấy dịch vụ sửa xe mà yên tâm từ đầu tới cuối.",
  },
  {
    id: "ngoc-lan",
    customerName: "Chị Ngọc Lan",
    serviceLabel: "Bảo dưỡng tận nơi",
    rating: 5,
    quote:
      "Đặt lịch bảo dưỡng ngay tại chung cư, thợ xuống tận hầm đỗ xe. Giá chốt trước trên app, làm xong nghiệm thu từng hạng mục mới thanh toán.",
  },
  {
    id: "thanh-tung",
    customerName: "Anh Thanh Tùng",
    serviceLabel: "Mua phụ tùng",
    rating: 5,
    quote:
      "Đặt má phanh trên app, hàng chính hãng có mã kiểm tra, giao cùng ngày. Thợ đến thay tận nhà và kiểm tra lại toàn bộ hệ thống phanh miễn phí.",
  },
  {
    id: "hoai-thuong",
    customerName: "Chị Hoài Thương",
    serviceLabel: "Sửa điện",
    rating: 5,
    quote:
      "Xe đề không nổ, thợ chẩn đoán đúng bệnh rơ-le khởi động chứ không chém gió thay cả cụm. Minh bạch từng đồng.",
  },
  {
    id: "duc-huy",
    customerName: "Anh Đức Huy",
    serviceLabel: "Thay lốp",
    rating: 5,
    quote:
      "Nát lốp giữa đường đi làm, đặt cứu hộ xong ngồi quán cà phê đợi. Theo dõi thợ di chuyển trên bản đồ như xem giao đồ ăn.",
  },
  {
    id: "bao-chau",
    customerName: "Chị Bảo Châu",
    serviceLabel: "Đặt thợ theo giờ",
    rating: 5,
    quote:
      "Chọn được khung giờ tối sau giờ làm, thợ đến đúng hẹn không trễ một phút. Có bảng giá niêm yết nên không lo bị chặt chém.",
  },
  {
    id: "gia-bao",
    customerName: "Anh Gia Bảo",
    serviceLabel: "Kiểm tra xe cũ",
    rating: 4,
    quote:
      "Thuê thợ đi kiểm tra xe cũ trước khi mua lại. Báo cáo chi tiết từng hạng mục kèm hình ảnh, nhờ đó trả được giá xuống đáng kể.",
  },
];
