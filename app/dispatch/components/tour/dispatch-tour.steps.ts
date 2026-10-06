import type { Tour } from "nextstepjs";
import { TOUR_STEP_OPTIONS } from "@/components/tour/tour-defaults";
import type { DispatchSectionId } from "../dispatch-sections";

// One tour per dispatch workspace section — the shell header button starts
// the tour matching the current route. Order/stock/report anchors without
// the `disp-` prefix (`orders-*`, `revenue-*`, `mix-*`) live on components
// shared with the admin workspace, so both workspaces reuse them.
// `disp-board-track` only renders on the two map-tracking tabs; the tour
// runtime skips it elsewhere after the configured retries.
export const DISPATCH_TOUR_NAMES: Record<DispatchSectionId, string> = {
  board: "disp-board-guide",
  rescue: "disp-rescue-guide",
  orders: "disp-orders-guide",
  vouchers: "disp-vouchers-guide",
  stock: "disp-stock-guide",
  revenue: "disp-revenue-guide",
  "customer-mix": "disp-mix-guide",
};

export const DISPATCH_TOUR_STEPS: Tour[] = [
  {
    tour: DISPATCH_TOUR_NAMES.board,
    steps: [
      {
        selector: '[data-tour="disp-board-intro"]',
        title: "Bàn điều phối đơn hàng",
        content:
          "Mọi đơn đặt lịch đi qua đây: xác nhận lịch hẹn, phân công thợ trực tuyến, hủy khi khách yêu cầu.",
        side: "bottom",
        ...TOUR_STEP_OPTIONS,
      },
      {
        selector: '[data-tour="disp-board-month"]',
        title: "Lọc theo tháng hẹn",
        content:
          "Đơn nhóm theo tháng đặt lịch — đổi tháng quay về trang đầu, nút Tải lại làm mới danh sách.",
        side: "bottom",
        ...TOUR_STEP_OPTIONS,
      },
      {
        selector: '[data-tour="disp-board-tabs"]',
        title: "Tab trạng thái đơn",
        content:
          "Tám trạng thái vòng đời đơn; hai tab Đang di chuyển và Đang sửa xe mở bản đồ theo dõi thợ trực tiếp.",
        side: "bottom",
        ...TOUR_STEP_OPTIONS,
      },
      {
        selector: '[data-tour="disp-board-track"]',
        title: "Bản đồ theo dõi thợ",
        content:
          "Ở tab Đang di chuyển hoặc Đang sửa xe, chọn một đơn để xem vị trí và lộ trình đã ghi của thợ.",
        side: "right",
        ...TOUR_STEP_OPTIONS,
      },
      {
        selector: '[data-tour="disp-board-queue"]',
        title: "Mở đơn để điều phối",
        content:
          "Bấm một đơn để xem chi tiết: xác nhận, chọn thợ, cập nhật trạng thái. Danh sách phân trang Trước/Sau ở cuối.",
        side: "top",
        ...TOUR_STEP_OPTIONS,
      },
    ],
  },
  {
    tour: DISPATCH_TOUR_NAMES.rescue,
    steps: [
      {
        selector: '[data-tour="disp-rescue-tabs"]',
        title: "Vòng đời cứu hộ",
        content:
          "Chờ thợ, Đã giao thợ, Thợ đã nhận, Đang di chuyển, Đã đến nơi — hệ thống tự giao thợ gần nhất từng lượt 30 giây, bạn giám sát.",
        side: "bottom",
        ...TOUR_STEP_OPTIONS,
      },
      {
        selector: '[data-tour="disp-rescue-list"]',
        title: "Can thiệp khi cần",
        content:
          "Mở chi tiết để xem lịch sử giao và thợ đang nhận; nút điện thoại gọi khách một chạm. Ca ưu tiên đánh dấu ngay trên thẻ.",
        side: "top",
        ...TOUR_STEP_OPTIONS,
      },
    ],
  },
  {
    tour: DISPATCH_TOUR_NAMES.orders,
    steps: [
      {
        selector: '[data-tour="disp-orders-intro"]',
        title: "Vận hành đơn linh kiện",
        content:
          "Xác nhận, đóng gói, giao và hủy đơn — hủy hoàn số lượng về kho. Nút Bán tại quầy tạo đơn POS ngay đây.",
        side: "bottom",
        ...TOUR_STEP_OPTIONS,
      },
      {
        selector: '[data-tour="disp-orders-month"]',
        title: "Lọc theo tháng đặt",
        content:
          "Đơn nhóm theo tháng đặt hàng — đổi tháng quay về trang đầu, nút Tải lại làm mới danh sách.",
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
        title: "Mở đơn để xử lý",
        content:
          "Bấm một đơn để đổi trạng thái, mở hóa đơn thu tiền hoặc xem thông tin giao hàng.",
        side: "top",
        ...TOUR_STEP_OPTIONS,
      },
    ],
  },
  {
    tour: DISPATCH_TOUR_NAMES.vouchers,
    steps: [
      {
        selector: '[data-tour="disp-vouchers-grant"]',
        title: "Phát voucher cho khách",
        content:
          "Chọn chiến dịch admin cho phép, nhập ID tài khoản khách và ghi chú lý do — vượt hạn mức hệ thống chặn.",
        side: "bottom",
        ...TOUR_STEP_OPTIONS,
      },
      {
        selector: '[data-tour="disp-vouchers-codes"]',
        title: "Đặt mã nhập tay",
        content:
          "Chọn chiến dịch rồi đặt hoặc đổi mã khách gõ khi đặt lịch — tại đây chỉ sửa mã, không đụng nội dung chiến dịch.",
        side: "bottom",
        ...TOUR_STEP_OPTIONS,
      },
      {
        selector: '[data-tour="disp-vouchers-public"]',
        title: "Ưu đãi khách đang thấy",
        content:
          "Đúng banner công khai ngoài trang chủ — kiểm tra điều kiện trước khi phát tay.",
        side: "top",
        ...TOUR_STEP_OPTIONS,
      },
    ],
  },
  {
    tour: DISPATCH_TOUR_NAMES.stock,
    steps: [
      {
        selector: '[data-tour="disp-stock-intro"]',
        title: "Kiểm kê tồn kho",
        content:
          "Đặt số lượng tuyệt đối cho từng linh kiện sau kiểm kê hoặc nhập hàng; sửa giá và danh mục ở trang quản trị.",
        side: "bottom",
        ...TOUR_STEP_OPTIONS,
      },
      {
        selector: '[data-tour="disp-stock-list"]',
        title: "Lọc rồi điều chỉnh",
        content:
          "Tìm theo tên, lọc danh mục hoặc tồn thấp rồi nhập số mới ngay trên dòng — danh sách tự phân trang.",
        side: "top",
        ...TOUR_STEP_OPTIONS,
      },
    ],
  },
  {
    tour: DISPATCH_TOUR_NAMES.revenue,
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
        selector: '[data-tour="revenue-trend"]',
        title: "Xu hướng và chỉ số",
        content:
          "Biểu đồ thu trong kỳ; bốn ô bên cạnh là tổng thu, so với kỳ trước, số giao dịch và trung bình mỗi phiếu.",
        side: "bottom",
        ...TOUR_STEP_OPTIONS,
      },
      {
        selector: '[data-tour="revenue-mix-source"]',
        title: "Cơ cấu theo nguồn",
        content:
          "Chia doanh thu theo đơn sửa chữa, đơn linh kiện, bán tại quầy; thẻ bên cạnh chia theo phương thức thanh toán.",
        side: "top",
        ...TOUR_STEP_OPTIONS,
      },
      {
        selector: '[data-tour="revenue-txns"]',
        title: "Từng giao dịch",
        content:
          "Bảng liệt kê từng phiếu thu trong kỳ kèm phân trang — đối chiếu với ví điện tử hoặc tiền mặt.",
        side: "top",
        ...TOUR_STEP_OPTIONS,
      },
    ],
  },
  {
    tour: DISPATCH_TOUR_NAMES["customer-mix"],
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
];
