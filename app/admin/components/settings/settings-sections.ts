// Anchored sections of /admin/settings. The nav chips render from this
// list; a new domain adds one row here plus a matching <section id> in
// SettingsAdminEntry.
export const SETTINGS_SECTIONS = [
  { id: "overview", label: "Tổng quan" },
  { id: "booking", label: "Đặt lịch" },
  { id: "hours", label: "Giờ làm việc" },
  { id: "shop", label: "Cửa hàng" },
] as const;
