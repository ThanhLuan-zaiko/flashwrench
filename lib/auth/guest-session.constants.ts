// Framework-free constants for the fw_gid guest token, so services that only
// need the lifetimes never pull in next/headers.
export const GUEST_COOKIE = "fw_gid";
export const GUEST_COOKIE_TTL_SECONDS = 30 * 24 * 60 * 60;
// Guest cart rows self-expire: the cookie can outlive the data on
// purpose, a stale token just sees an empty cart again.
export const GUEST_CART_TTL_SECONDS = 7 * 24 * 60 * 60;
