// Auto-grant rules: staff-configured triggers that let the system issue
// campaign vouchers without a manual grant. Trigger types:
//   signup         — once when a customer account is created
//   booking_count  — every `threshold` completed bookings
//   order_count    — every `threshold` delivered orders
//   order_value    — each delivered order whose total >= `threshold` VND
//   spend_total    — every `threshold` VND of cumulative completed spend
//   review_created — each review a customer posts
//   win_back       — a customer inactive for `window_days` days
export type AutoTrigger =
  | "signup"
  | "booking_count"
  | "order_count"
  | "order_value"
  | "spend_total"
  | "review_created"
  | "win_back";

export const AUTO_TRIGGERS: readonly AutoTrigger[] = [
  "signup",
  "booking_count",
  "order_count",
  "order_value",
  "spend_total",
  "review_created",
  "win_back",
];

export type AutoRuleRow = {
  rule_id: string;
  name: string | null;
  campaign_id: string | null;
  trigger_type: string | null;
  threshold: number | null;
  window_days: number | null;
  is_active: boolean | null;
  granted_count: number | null;
  created_by: string | null;
  created_at: Date | null;
  updated_at: Date | null;
};

// Staff-facing shape: campaign code/name are joined in for display.
export type VoucherAutoRule = {
  id: string;
  name: string;
  campaignId: string;
  campaignCode: string;
  campaignName: string;
  triggerType: AutoTrigger;
  threshold: number;
  windowDays: number;
  isActive: boolean;
  grantedCount: number;
  createdAt: string | null;
};

export type CustomerStatsRow = {
  customer_id: string;
  completed_bookings: number | null;
  completed_orders: number | null;
  total_spent: number | null;
  last_activity_at: Date | null;
  updated_at: Date | null;
};

// One "almost there" row on the dispatcher board: this customer is one
// step away from the rule's next milestone.
export type NearMilestoneEntry = {
  userId: string;
  ruleId: string;
  ruleName: string;
  triggerType: AutoTrigger;
  current: number;
  threshold: number;
};

export type AutoRuleFieldErrors = Partial<
  Record<
    "name" | "campaignId" | "triggerType" | "threshold" | "windowDays" | "form",
    string
  >
>;

export type AutoRuleResult<T> =
  | { ok: true; data: T }
  | { ok: false; status: number; errors: AutoRuleFieldErrors };

export type CreateAutoRuleInput = {
  name: string;
  campaignId: string;
  triggerType: AutoTrigger;
  threshold?: number;
  windowDays?: number;
  isActive?: boolean;
};
