import type { PublicUser } from "./user.types";

// Shared vocabulary for the forced-logout flow. The admin lock route
// publishes `{ kind: "locked" }` on `user:{userId}`, `/api/auth/me` reports
// the same states, and the browser guard renders one notice per state, so
// all three sides speak these types instead of ad-hoc strings.

export type AccountBlockReason = "locked" | "deleted";

export type AccountStatus = "active" | AccountBlockReason;

export type AccountSession = {
  user: PublicUser | null;
  status: AccountStatus;
};

export const ACCOUNT_LOCK_EVENT_KIND = "locked";

// Realtime payload -> block reason. Anything else is ignored, so the
// account inbox topic stays reusable for other notices later.
export function parseAccountLockEvent(
  payload: unknown,
): AccountBlockReason | null {
  if (typeof payload !== "object" || payload === null) return null;
  const kind = (payload as { kind?: unknown }).kind;
  return kind === ACCOUNT_LOCK_EVENT_KIND ? "locked" : null;
}

// Status -> block reason, or null while the account stays usable.
export function toBlockReason(
  status: AccountStatus,
): AccountBlockReason | null {
  return status === "active" ? null : status;
}

export type AccountBlockNotice = {
  title: string;
  description: string;
  login: string;
};

const NOTICES: Record<AccountBlockReason, AccountBlockNotice> = {
  locked: {
    title: "Tài khoản đã bị khóa",
    description:
      "Phiên đăng nhập của bạn đã kết thúc trên mọi thiết bị. Vui lòng liên hệ quản trị viên để được hỗ trợ.",
    login:
      "Tài khoản của bạn đã bị quản trị viên khóa nên mọi phiên đăng nhập đều kết thúc. Nếu đây là nhầm lẫn, vui lòng liên hệ bộ phận hỗ trợ.",
  },
  deleted: {
    title: "Tài khoản đã bị xóa",
    description:
      "Tài khoản này không còn hoạt động nên phiên đăng nhập đã kết thúc. Vui lòng liên hệ quản trị viên nếu cần khôi phục.",
    login:
      "Tài khoản của bạn không còn hoạt động nên mọi phiên đăng nhập đều kết thúc. Vui lòng liên hệ bộ phận hỗ trợ nếu cần thêm trợ giúp.",
  },
};

export function accountBlockNotice(
  reason: AccountBlockReason,
): AccountBlockNotice {
  return NOTICES[reason];
}

// The forced logout sends the browser to the login page with this marker:
// the toast and the blocking overlay disappear with the page, the notice
// on the login screen does not.
export const ACCOUNT_LOCKED_QUERY = "locked";
export const ACCOUNT_LOCKED_QUERY_VALUE = "1";

export function accountLockedLoginHref(): string {
  return `/login?${ACCOUNT_LOCKED_QUERY}=${ACCOUNT_LOCKED_QUERY_VALUE}`;
}

export function isAccountLockedParam(value: string | undefined): boolean {
  return value === ACCOUNT_LOCKED_QUERY_VALUE;
}
