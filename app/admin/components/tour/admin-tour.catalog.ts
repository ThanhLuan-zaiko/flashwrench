import type { Tour } from "nextstepjs";
import { TOUR_STEP_OPTIONS } from "@/components/tour/tour-defaults";
import { ADMIN_TOUR_NAMES } from "./admin-tour.names";

// Catalog tours: overview, people and the CRUD boards that share the same
// stat-row + tab-bar + list grammar.
export const ADMIN_CATALOG_TOURS: Tour[] = [
  {
    tour: ADMIN_TOUR_NAMES.dashboard,
    steps: [
      {
        selector: '[data-tour="admin-dash-hero"]',
        title: "Vận hành hôm nay",
        content:
          "Lịch hôm nay, cứu hộ đang mở, thợ trực tuyến — kèm lối tắt duyệt thợ và cấu hình dịch vụ.",
        side: "bottom",
        ...TOUR_STEP_OPTIONS,
      },
      {
        selector: '[data-tour="admin-dash-stats"]',
        title: "Số liệu trực tiếp",
        content:
          "Các ô đếm tự làm mới theo thời gian thực: đơn, cứu hộ, thợ trực tuyến và doanh thu tháng.",
        side: "bottom",
        ...TOUR_STEP_OPTIONS,
      },
      {
        selector: '[data-tour="admin-dash-activity"]',
        title: "Hoạt động thu tiền",
        content:
          "Nhật ký mới nhất: phiếu thu đã ghi, mã xác nhận đã cấp và các lần nhập sai.",
        side: "top",
        ...TOUR_STEP_OPTIONS,
      },
      {
        selector: '[data-tour="admin-dash-alerts"]',
        title: "Cảnh báo vận hành",
        content:
          "Nhập sai mã xác nhận, cứu hộ chờ điều phối, phiếu thu hôm nay — đổi “Cần chú ý” khi có bất thường.",
        side: "left",
        ...TOUR_STEP_OPTIONS,
      },
    ],
  },
  {
    tour: ADMIN_TOUR_NAMES.users,
    steps: [
      {
        selector: '[data-tour="admin-users-stats"]',
        title: "Bốn ô tổng quan",
        content:
          "Số thợ chờ duyệt, tài khoản, nhân viên và khiếu nại đang mở — cập nhật liên tục.",
        side: "bottom",
        ...TOUR_STEP_OPTIONS,
      },
      {
        selector: '[data-tour="admin-users-tabs"]',
        title: "Sáu nhóm quản lý",
        content:
          "Duyệt thợ, khóa tài khoản, nhân viên, khách hàng, thùng rác và khiếu nại — mỗi tab một đường link riêng.",
        side: "bottom",
        ...TOUR_STEP_OPTIONS,
      },
      {
        selector: '[data-tour="admin-users-board"]',
        title: "Thao tác trên từng dòng",
        content:
          "Duyệt, khóa, xóa mềm hoặc xử lý khiếu nại ngay trên dòng; tài khoản của chính bạn bị ẩn thao tác nguy hiểm.",
        side: "top",
        ...TOUR_STEP_OPTIONS,
      },
    ],
  },
  {
    tour: ADMIN_TOUR_NAMES.services,
    steps: [
      {
        selector: '[data-tour="admin-services-stats"]',
        title: "Số liệu danh mục",
        content:
          "Loại hình và mục giá đang bật, cùng số mục đang nằm trong thùng rác.",
        side: "bottom",
        ...TOUR_STEP_OPTIONS,
      },
      {
        selector: '[data-tour="admin-services-tabs"]',
        title: "Loại hình · Bảng giá · Thùng rác",
        content:
          "Chuyển tab để quản lý từng nhóm; nút Thêm ở góc phải tạo loại hình hoặc mục giá mới.",
        side: "bottom",
        ...TOUR_STEP_OPTIONS,
      },
      {
        selector: '[data-tour="admin-services-board"]',
        title: "Sửa, ẩn, xóa từng dòng",
        content:
          "Mở menu trên dòng để sửa, bật tắt hoặc đưa vào thùng rác — mục đang tắt khách không thấy khi đặt lịch.",
        side: "top",
        ...TOUR_STEP_OPTIONS,
      },
    ],
  },
  {
    tour: ADMIN_TOUR_NAMES.products,
    steps: [
      {
        selector: '[data-tour="admin-products-stats"]',
        title: "Số liệu cửa hàng",
        content: "Danh mục và sản phẩm đang bán, cùng số mục trong thùng rác.",
        side: "bottom",
        ...TOUR_STEP_OPTIONS,
      },
      {
        selector: '[data-tour="admin-products-tabs"]',
        title: "Danh mục · Sản phẩm · Thùng rác",
        content:
          "Chuyển tab quản lý từng nhóm; nút Thêm ở góc phải tạo danh mục hoặc sản phẩm.",
        side: "bottom",
        ...TOUR_STEP_OPTIONS,
      },
      {
        selector: '[data-tour="admin-products-board"]',
        title: "Sửa, ẩn, xóa từng dòng",
        content:
          "Menu dòng mở sửa, bật tắt hoặc đưa vào thùng rác — sản phẩm tắt biến mất khỏi trang mua hàng.",
        side: "top",
        ...TOUR_STEP_OPTIONS,
      },
    ],
  },
  {
    tour: ADMIN_TOUR_NAMES.vouchers,
    steps: [
      {
        selector: '[data-tour="admin-vouchers-stats"]',
        title: "Số liệu chiến dịch",
        content:
          "Chiến dịch đang chạy, lượt voucher đã phát và số chiến dịch điều phối được quyền phát.",
        side: "bottom",
        ...TOUR_STEP_OPTIONS,
      },
      {
        selector: '[data-tour="admin-vouchers-tabs"]',
        title: "Chiến dịch · Thùng rác",
        content:
          "Danh sách chiến dịch đang sống; thùng rác giữ các mục đã xóa để khôi phục.",
        side: "bottom",
        ...TOUR_STEP_OPTIONS,
      },
      {
        selector: '[data-tour="admin-vouchers-board"]',
        title: "Tạo và chỉnh chiến dịch",
        content:
          "Nút Thêm chiến dịch mở biểu mẫu: giá trị, ngân sách phát, quyền điều phối — menu dòng để sửa hoặc xóa.",
        side: "top",
        ...TOUR_STEP_OPTIONS,
      },
    ],
  },
];
