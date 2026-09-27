export type RescueIssueOption = {
  value: string;
  label: string;
  hint: string;
};

export const RESCUE_ISSUE_OPTIONS: RescueIssueOption[] = [
  {
    value: "flat_tire",
    label: "Thủng lốp / xẹp lốp",
    hint: "Lốp xẹp, nổ lốp giữa đường",
  },
  {
    value: "dead_battery",
    label: "Hết bình / đề không lên",
    hint: "Đề yếu, đèn mờ, không nổ máy",
  },
  {
    value: "engine_failure",
    label: "Chết máy / lỗi động cơ",
    hint: "Máy tắt đột ngột, báo lỗi động cơ",
  },
  {
    value: "accident",
    label: "Va chạm / tai nạn",
    hint: "Ưu tiên xử lý nhanh, giữ an toàn",
  },
  {
    value: "out_of_fuel",
    label: "Hết nhiên liệu",
    hint: "Hết xăng/dầu, cần tiếp nhiên liệu",
  },
  {
    value: "overheating",
    label: "Xe quá nhiệt",
    hint: "Kim nhiệt lên cao, bốc khói",
  },
  {
    value: "locked_out",
    label: "Quên chìa / kẹt khóa",
    hint: "Không mở được cửa hoặc cốp xe",
  },
  { value: "other", label: "Sự cố khác", hint: "Mô tả chi tiết bên dưới" },
];

export const RESCUE_HOTLINE = "1900 6368";

export const RESCUE_STEPS = [
  {
    title: "Gửi yêu cầu",
    body: "Điền tên, số điện thoại, vị trí xe và sự cố. Không cần đăng nhập.",
  },
  {
    title: "Thợ xác nhận",
    body: "Điều phối viên gọi lại ngay để xác nhận vị trí và báo giá.",
  },
  {
    title: "Thợ tới nơi",
    body: "Theo dõi trạng thái qua điện thoại. Trường hợp nguy hiểm hãy gọi hotline.",
  },
] as const;
