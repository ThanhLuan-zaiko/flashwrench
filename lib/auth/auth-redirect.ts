// Safe post-auth redirect targets. Login and register accept `?next=` so a
// guest who starts booking from /services returns to the booking entry
// instead of the homepage. Every consumer must validate through
// getSafeNextPath: raw query values are attacker-controlled.

import type { UserRole } from "./user.types";

const MAX_NEXT_LENGTH = 512;

// Auth pages themselves are never valid targets: bouncing a logged-in user
// back to /login or /register would loop the exact bug this fixes.
const AUTH_PREFIXES = ["/login", "/register"];

// API routes are never valid browser targets after a form submit.
const FORBIDDEN_PREFIXES = ["/api", ...AUTH_PREFIXES];

// Resolve the fallbacks per role when no safe `next` was provided.
export function defaultPostAuthHref(role: UserRole): string {
  return role === "admin" ? "/admin" : "/";
}

// Accept only same-origin absolute paths such as `/booking?serviceId=x`.
// Reject externals (`https:`, `//host`), protocol tricks (`javascript:`),
// backslashes, and overlong values.
export function getSafeNextPath(
  next: string | null | undefined,
): string | null {
  if (!next) return null;
  const value = next.trim();
  if (value.length === 0 || value.length > MAX_NEXT_LENGTH) return null;
  if (!value.startsWith("/")) return null;
  if (value.startsWith("//")) return null;
  if (value.startsWith("/\\") || value.startsWith("/%5c")) return null;
  const lower = value.toLowerCase();
  if (
    lower.startsWith("javascript:") ||
    lower.includes("://") ||
    value.includes("\\")
  ) {
    return null;
  }
  if (FORBIDDEN_PREFIXES.some((prefix) => isPathPrefix(value, prefix))) {
    return null;
  }
  try {
    const parsed = new URL(value, "https://flashwrench.local");
    if (parsed.origin !== "https://flashwrench.local") return null;
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return null;
  }
}

// Compare on pathname boundaries so `/loginfoo` stays allowed while
// `/login?x=1` and `/login/expired` are rejected as auth loops.
function isPathPrefix(value: string, prefix: string): boolean {
  if (value === prefix) return true;
  return (
    value.startsWith(`${prefix}/`) ||
    value.startsWith(`${prefix}?`) ||
    value.startsWith(`${prefix}#`)
  );
}

// Resolve where a form should push after success: the safe `next` wins,
// otherwise fall back to the role landing page.
export function resolvePostAuthHref(
  role: UserRole,
  next: string | null | undefined,
): string {
  return getSafeNextPath(next) ?? defaultPostAuthHref(role);
}

// Build `/login?next=<encoded>` for guests starting a booking. The inner
// booking href is validated first so an unsafe service id cannot smuggle
// an open redirect into the login URL.
export function buildLoginHref(next?: string | null): string {
  const safe = getSafeNextPath(next);
  return safe ? `/login?next=${encodeURIComponent(safe)}` : "/login";
}

// Same preservation for the register footer links.
export function buildRegisterHref(next?: string | null): string {
  const safe = getSafeNextPath(next);
  return safe ? `/register?next=${encodeURIComponent(safe)}` : "/register";
}

// Booking entry for an optional preselected service. Unknown ids still
// produce a valid page: /booking resolves them to a guidance panel.
export function buildBookingHref(serviceId?: string | null): string {
  const id = (serviceId ?? "").trim();
  if (!id) return "/booking";
  if (id.length > 128 || id.includes("/") || id.includes("\\")) {
    return "/booking";
  }
  return `/booking?serviceId=${encodeURIComponent(id)}`;
}
