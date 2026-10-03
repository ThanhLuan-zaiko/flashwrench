// Member-vs-guest report shapes. kind = what was counted, channel = who
// did it: member (signed-in account) or guest (no account / OTP email).
// signup stays its own kind — folding registrations into logins would
// inflate sign-ins and lose the guest-to-member conversion signal.
export const MIX_KINDS = [
  "booking",
  "order",
  "rescue",
  "login",
  "signup",
] as const;
export type MixKind = (typeof MIX_KINDS)[number];

export const MIX_CHANNELS = ["member", "guest"] as const;
export type MixChannel = (typeof MIX_CHANNELS)[number];

export const MIX_RANGES = ["day", "week", "month"] as const;
export type MixRange = (typeof MIX_RANGES)[number];

export function isMixRange(value: unknown): value is MixRange {
  return (
    typeof value === "string" &&
    (MIX_RANGES as readonly string[]).includes(value)
  );
}

/** Raw counter row from customer_mix_daily. */
export type MixCounterRow = {
  day: string;
  kind: string;
  channel: string;
  total: number;
};

/** Raw actor row from customer_mix_actors — one unique identity. */
export type MixActorRow = {
  day: string;
  kind: string;
  channel: string;
  actor: string;
};

/** One chart bucket: created orders split by channel. */
export type MixOrderPoint = {
  key: string;
  label: string;
  member: number;
  guest: number;
};

/** One chart bucket: verified sign-ins split by channel. */
export type MixLoginPoint = {
  key: string;
  label: string;
  member: number;
  guest: number;
};

/** Order-creating kinds only — logins and signups are not orders. */
export type MixOrderKind = Exclude<MixKind, "login" | "signup">;

/** Orders of one kind split by channel. */
export type MixKindSlice = {
  kind: MixOrderKind;
  member: number;
  guest: number;
};

export type CustomerMixReport = {
  range: MixRange;
  anchor: string;
  label: string;
  timeZone: string;
  orderSeries: MixOrderPoint[];
  loginSeries: MixLoginPoint[];
  byKind: MixKindSlice[];
  totals: {
    memberOrders: number;
    guestOrders: number;
    memberLogins: number;
    guestLogins: number;
    /** New accounts registered in the range (always member channel). */
    memberSignups: number;
    /** Share of created orders filed by members, null when empty. */
    memberShare: number | null;
    /** Unique member accounts that created an order-kind record. */
    memberBuyers: number;
    /** Unique guest emails that created an order-kind record. */
    guestBuyers: number;
    /** Unique member accounts that signed in. */
    memberLoginActors: number;
    /** Unique guest emails verified via OTP. */
    guestLoginActors: number;
  };
};

export type MixReportResult =
  | { ok: true; data: CustomerMixReport }
  | { ok: false; status: number; errors: { form?: string } };
