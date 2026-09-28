// Admin variants of the order status tabs — same ids and icons as the
// dispatch set, but every href stays inside the admin workspace so an
// admin never lands on a dispatcher screen.
import {
  DISPATCH_ORDER_TABS,
  type DispatchOrderTab,
  type DispatchOrderTabDef,
} from "@/app/dispatch/components/orders/order-tabs";

export const ADMIN_ORDER_TABS: DispatchOrderTabDef[] = DISPATCH_ORDER_TABS.map(
  (tab) => ({ ...tab, href: `/admin/orders/${tab.id}` }),
);

export function isAdminOrderTab(value: unknown): value is DispatchOrderTab {
  return ADMIN_ORDER_TABS.some((tab) => tab.id === value);
}
