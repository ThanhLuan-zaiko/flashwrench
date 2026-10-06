import type { Tour } from "nextstepjs";
import { TOUR_STEP_OPTIONS } from "@/components/tour/tour-defaults";
import type { MechanicSectionId } from "../mechanic-sections";

// One tour per mechanic workspace section — the shell header button starts
// the tour matching the current route, so every selector is guaranteed to
// exist on that screen. `mech-rescue-inbox` is intentionally optional: the
// inbox only renders while a 30s offer is live, and the tour runtime skips
// missing selectors after the configured retries.
export const MECHANIC_TOUR_NAMES: Record<MechanicSectionId, string> = {
  schedule: "mech-schedule-guide",
  map: "mech-map-guide",
  income: "mech-income-guide",
  stats: "mech-stats-guide",
};

export const MECHANIC_TOUR_STEPS: Tour[] = [
  {
    tour: MECHANIC_TOUR_NAMES.schedule,
    steps: [
      {
        selector: '[data-tour="mech-presence"]',
        title: "Bật trực tuyến để nhận đơn",
        content:
          "Thẻ trong menu bên trái giữ công tắc trực tuyến, kỹ năng và điểm xuất phát — hệ thống chỉ giao đơn khi bạn trực tuyến. Trên điện thoại, mở menu để thấy thẻ này.",
        side: "right",
        ...TOUR_STEP_OPTIONS,
      },
      {
        selector: '[data-tour="mech-rescue-inbox"]',
        title: "Cứu hộ ghim lên đầu",
        content:
          "Ca cứu hộ hệ thống giao hiện ở đây kèm đếm ngược 30 giây — nhận hoặc từ chối trước khi hết giờ.",
        side: "bottom",
        ...TOUR_STEP_OPTIONS,
      },
      {
        selector: '[data-tour="mech-schedule-stats"]',
        title: "Bốn ô theo dõi ca làm",
        content:
          "Đơn chờ nhận, đang thực hiện, đã xong và doanh thu của danh sách cập nhật liên tục theo thời gian thực.",
        side: "bottom",
        ...TOUR_STEP_OPTIONS,
      },
      {
        selector: '[data-tour="mech-schedule-tabs"]',
        title: "Lọc đơn theo trạng thái",
        content:
          "Mỗi tab là một đường link riêng kèm số đơn trực tiếp — chuyển tab không tải lại trang.",
        side: "bottom",
        ...TOUR_STEP_OPTIONS,
      },
      {
        selector: '[data-tour="mech-schedule-queue"]',
        title: "Mở đơn để xử lý",
        content:
          "Bấm một đơn để xem chi tiết và đổi trạng thái: nhận việc, báo đang tới, hoàn thành, thu tiền. Danh sách tự phân trang khi đơn nhiều.",
        side: "top",
        ...TOUR_STEP_OPTIONS,
      },
    ],
  },
  {
    tour: MECHANIC_TOUR_NAMES.map,
    steps: [
      {
        selector: '[data-tour="mech-map-share"]',
        title: "Chia sẻ vị trí của bạn",
        content:
          "Bấm để cập nhật điểm xuất phát tính quãng đường; khi đơn đang “Đang di chuyển”, nút này phát lộ trình trực tiếp cho khách.",
        side: "bottom",
        ...TOUR_STEP_OPTIONS,
      },
      {
        selector: '[data-tour="mech-map-board"]',
        title: "Bản đồ ghim điểm đến",
        content:
          "Vị trí của bạn và điểm sửa đang chọn ghim trên bản đồ; hàng bên dưới mở Google Maps chỉ đường.",
        side: "bottom",
        ...TOUR_STEP_OPTIONS,
      },
      {
        selector: '[data-tour="mech-map-list"]',
        title: "Đơn mở theo quãng đường",
        content:
          "Đơn gần nhất xếp lên trước — chọn một đơn để ghim lên bản đồ và xem thông tin khách.",
        side: "left",
        ...TOUR_STEP_OPTIONS,
      },
    ],
  },
  {
    tour: MECHANIC_TOUR_NAMES.income,
    steps: [
      {
        selector: '[data-tour="mech-income-summary"]',
        title: "Thu nhập theo kỳ",
        content:
          "Bốn ô tổng hợp tiền thu hôm nay, tuần này, tháng này và phần đang chờ thu từ khách.",
        side: "bottom",
        ...TOUR_STEP_OPTIONS,
      },
      {
        selector: '[data-tour="mech-income-tabs"]',
        title: "Lọc theo trạng thái thu",
        content:
          "Tất cả, Đã thu, Chờ thu, Đã hoàn — mỗi tab là một đường link riêng kèm số giao dịch.",
        side: "bottom",
        ...TOUR_STEP_OPTIONS,
      },
      {
        selector: '[data-tour="mech-income-history"]',
        title: "Bấm dòng để thu tiền",
        content:
          "Mở một giao dịch để xem đơn gốc; đơn chưa thu có nút Thu tiền mở hộp thoại nhập số tiền và mã xác nhận của khách.",
        side: "top",
        ...TOUR_STEP_OPTIONS,
      },
    ],
  },
  {
    tour: MECHANIC_TOUR_NAMES.stats,
    steps: [
      {
        selector: '[data-tour="mech-stats-counters"]',
        title: "Bốn chỉ số chính",
        content:
          "Đơn hoàn thành, tỷ lệ hoàn thành, đánh giá trung bình và doanh thu tích lũy của bạn.",
        side: "bottom",
        ...TOUR_STEP_OPTIONS,
      },
      {
        selector: '[data-tour="mech-stats-chart"]',
        title: "Hiệu suất 6 tháng",
        content:
          "Cột đơn hoàn thành từng tháng kèm tổng doanh thu của các đơn đã xong.",
        side: "top",
        ...TOUR_STEP_OPTIONS,
      },
      {
        selector: '[data-tour="mech-stats-rating"]',
        title: "Phân bố sao",
        content:
          "Số lượt đánh giá ở từng mức sao — giữ chất lượng để đẩy điểm trung bình.",
        side: "left",
        ...TOUR_STEP_OPTIONS,
      },
      {
        selector: '[data-tour="mech-stats-reviews"]',
        title: "Khách nhận xét gì",
        content:
          "Các đánh giá mới nhất kèm lời nhắn của khách và ngày ghi nhận.",
        side: "left",
        ...TOUR_STEP_OPTIONS,
      },
    ],
  },
];
