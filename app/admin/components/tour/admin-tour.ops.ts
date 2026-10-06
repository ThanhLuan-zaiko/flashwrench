import type { Tour } from "nextstepjs";
import { TOUR_STEP_OPTIONS } from "@/components/tour/tour-defaults";
import { ADMIN_TOUR_NAMES } from "./admin-tour.names";

// Operations and reporting tours. Anchors without the `admin-` prefix
// (`orders-*`, `revenue-*`, `mix-*`) live on components shared with the
// dispatch workspace, so both workspaces reuse them.
export const ADMIN_OPS_TOURS: Tour[] = [
  {
    tour: ADMIN_TOUR_NAMES.orders,
    steps: [
      {
        selector: '[data-tour="admin-orders-intro"]',
        title: "Giám sát đơn linh kiện",
        content:
          "Theo dõi toàn bộ đơn và mở hóa đơn thu tiền — thao tác vận hành do điều phối thực hiện.",
        side: "bottom",
        ...TOUR_STEP_OPTIONS,
      },
      {
        selector: '[data-tour="admin-orders-month"]',
        title: "Lọc theo tháng đặt",
        content:
          "Đơn nhóm theo tháng đặt hàng — đổi tháng để tra đơn cũ, nút Tải lại làm mới danh sách.",
        side: "bottom",
        ...TOUR_STEP_OPTIONS,
      },
      {
        selector: '[data-tour="orders-tabs"]',
        title: "Tab trạng thái đơn",
        content:
          "Chuyển giữa các trạng thái vòng đời đơn — di chuột lên tab để tải trước dữ liệu.",
        side: "bottom",
        ...TOUR_STEP_OPTIONS,
      },
      {
        selector: '[data-tour="orders-queue"]',
        title: "Xem đơn và hóa đơn",
        content:
          "Bấm một đơn để mở hóa đơn chi tiết: món hàng, số tiền đã thu và người thu.",
        side: "top",
        ...TOUR_STEP_OPTIONS,
      },
    ],
  },
  {
    tour: ADMIN_TOUR_NAMES.rescue,
    steps: [
      {
        selector: '[data-tour="admin-rescue-sla"]',
        title: "Cấu hình tự điều phối",
        content:
          "Thời gian chờ mỗi lượt, số lần giao lại tối đa và số thợ mỗi đợt — áp dụng ngay cho lượt giao tiếp theo.",
        side: "bottom",
        ...TOUR_STEP_OPTIONS,
      },
      {
        selector: '[data-tour="admin-rescue-zones"]',
        title: "Vùng phục vụ",
        content:
          "Điểm ghim của khách rơi vào vùng nào thì ca thuộc vùng đó — chưa có vùng nào thì phát toàn hệ thống.",
        side: "left",
        ...TOUR_STEP_OPTIONS,
      },
    ],
  },
  {
    tour: ADMIN_TOUR_NAMES.revenue,
    steps: [
      {
        selector: '[data-tour="revenue-ranges"]',
        title: "Chọn kỳ báo cáo",
        content:
          "Ngày, tuần, tháng, năm — mỗi kỳ một đường link riêng để chia sẻ.",
        side: "bottom",
        ...TOUR_STEP_OPTIONS,
      },
      {
        selector: '[data-tour="revenue-toolbar"]',
        title: "Dịch chuyển kỳ, xuất CSV",
        content:
          "Mũi tên qua kỳ trước hoặc sau, chọn ngày bất kỳ, về kỳ hiện tại và tải CSV cho kỳ đang xem.",
        side: "bottom",
        ...TOUR_STEP_OPTIONS,
      },
      {
        selector: '[data-tour="revenue-mechanic"]',
        title: "Doanh thu theo thợ",
        content:
          "Admin thấy thêm cơ cấu theo từng thợ phụ trách — phát hiện thợ thu lệch bất thường.",
        side: "top",
        ...TOUR_STEP_OPTIONS,
      },
      {
        selector: '[data-tour="revenue-txns"]',
        title: "Từng giao dịch",
        content:
          "Bảng phiếu thu trong kỳ kèm cột người thu và phân trang — đối chiếu sổ sách ngay tại đây.",
        side: "top",
        ...TOUR_STEP_OPTIONS,
      },
      {
        selector: '[data-tour="admin-fraud"]',
        title: "Dấu hiệu bất thường",
        content:
          "Heuristic chống gian lận: tiền mặt thiếu xác nhận, người thu lệch thợ, dồn tiền bất thường, thu lặp.",
        side: "top",
        ...TOUR_STEP_OPTIONS,
      },
      {
        selector: '[data-tour="admin-audit"]',
        title: "Nhật ký thu tiền",
        content:
          "Mọi sự kiện thanh toán trong kỳ: phiếu thu, cấp mã, sai mã, hoàn tiền — ai làm, lúc nào.",
        side: "top",
        ...TOUR_STEP_OPTIONS,
      },
    ],
  },
  {
    tour: ADMIN_TOUR_NAMES["customer-mix"],
    steps: [
      {
        selector: '[data-tour="mix-ranges"]',
        title: "Chọn kỳ báo cáo",
        content:
          "Ngày, tuần hoặc tháng — báo cáo tách khách thành viên khỏi khách vãng lai.",
        side: "bottom",
        ...TOUR_STEP_OPTIONS,
      },
      {
        selector: '[data-tour="mix-toolbar"]',
        title: "Dịch chuyển kỳ",
        content: "Mũi tên qua lại các kỳ hoặc chọn ngày bất kỳ để neo báo cáo.",
        side: "bottom",
        ...TOUR_STEP_OPTIONS,
      },
      {
        selector: '[data-tour="mix-channel"]',
        title: "Đơn tạo theo kênh",
        content:
          "Đường biểu đồ tách đơn thành viên khỏi vãng lai — nhìn kênh nào đang tăng.",
        side: "bottom",
        ...TOUR_STEP_OPTIONS,
      },
      {
        selector: '[data-tour="mix-kpis"]',
        title: "Bốn ô tổng hợp",
        content:
          "Đơn và lượt đăng nhập tách riêng thành viên/vãng lai kèm số khách duy nhất và đăng ký mới.",
        side: "top",
        ...TOUR_STEP_OPTIONS,
      },
      {
        selector: '[data-tour="mix-split"]',
        title: "Đơn theo loại",
        content:
          "Sửa chữa, cứu hộ, linh kiện chia theo thành viên/vãng lai; thẻ bên cạnh là đăng nhập theo kênh.",
        side: "top",
        ...TOUR_STEP_OPTIONS,
      },
    ],
  },
  {
    tour: ADMIN_TOUR_NAMES.settings,
    steps: [
      {
        selector: '[data-tour="admin-settings-nav"]',
        title: "Bốn nhóm cài đặt",
        content:
          "Liên kết nhảy tới từng nhóm: tổng quan, đặt lịch, giờ làm việc và thông tin cửa hàng.",
        side: "bottom",
        ...TOUR_STEP_OPTIONS,
      },
      {
        selector: '[data-tour="admin-settings-overview"]',
        title: "Ảnh chụp chính sách",
        content:
          "Tóm tắt tham số đang áp dụng — đọc nhanh trước khi chỉnh ở các nhóm bên dưới.",
        side: "bottom",
        ...TOUR_STEP_OPTIONS,
      },
      {
        selector: '[data-tour="admin-settings-booking"]',
        title: "Chính sách đặt lịch",
        content:
          "Khung slot và giới hạn áp dụng cho đơn mới — đơn đã đặt giữ nguyên trạng thái.",
        side: "top",
        ...TOUR_STEP_OPTIONS,
      },
      {
        selector: '[data-tour="admin-settings-hours"]',
        title: "Giờ làm việc",
        content:
          "Khung giờ mở cửa quyết định khách chọn được giờ nào khi đặt lịch.",
        side: "top",
        ...TOUR_STEP_OPTIONS,
      },
      {
        selector: '[data-tour="admin-settings-shop"]',
        title: "Thông tin cửa hàng",
        content:
          "Tên, địa chỉ và liên hệ hiển thị trên hóa đơn cùng trang công khai.",
        side: "top",
        ...TOUR_STEP_OPTIONS,
      },
    ],
  },
];
