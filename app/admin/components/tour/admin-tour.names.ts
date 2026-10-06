import type { AdminSectionId } from "../admin-sections";

// One tour per admin workspace section — the shell header button starts
// the tour matching the current route, so every selector is guaranteed to
// exist on that screen.
export const ADMIN_TOUR_NAMES: Record<AdminSectionId, string> = {
  dashboard: "admin-dashboard-guide",
  users: "admin-users-guide",
  services: "admin-services-guide",
  products: "admin-products-guide",
  vouchers: "admin-vouchers-guide",
  orders: "admin-orders-guide",
  rescue: "admin-rescue-guide",
  revenue: "admin-revenue-guide",
  "customer-mix": "admin-mix-guide",
  settings: "admin-settings-guide",
};
