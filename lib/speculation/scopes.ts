import {
  buildSpeculationRules,
  type SpeculationRuleSet,
} from "@/lib/speculation/speculation-rules";

// One speculation profile per page area. Every entry is a document rule,
// so it only ever fires on links actually rendered inside the page — a
// pattern stays harmless when the current screen has no matching anchor.
//
// Prerender is reserved for public, guest-safe destinations (the catalog
// and the rescue page render identically signed out). Anything auth-gated
// or volatile (booking, checkout, staff workspaces) stays a prefetch so a
// speculation never spins up a document that immediately redirects, and
// never runs live polling code the user may discard.
//
// Pagination coverage: `/page/N` links ride each scope's section pattern
// (`/services/*` covers `/services/<slug>/page/2`, `/dispatch/*` covers
// every board's page segment, `/vouchers/page/*` covers the wallet
// pager). Embedded pagers instead link back to the
// SAME pathname with a namespaced param (`?srv_page=2`, `?cm_<id>=2`) —
// scopes hosting those widgets must self-match the bare path (`/booking*`,
// `/history*`), because a pattern like `/history/*` never fires on
// `/history?cm_x=2`.

export type SpeculationScope =
  | "home"
  | "services"
  | "products"
  | "cart"
  | "checkout"
  | "orders"
  | "history"
  | "booking"
  | "rescue"
  | "track"
  | "lookup"
  | "login"
  | "register"
  | "account"
  | "vouchers"
  | "mechanic"
  | "dispatch"
  | "admin";

const SCOPE_RULES: Record<SpeculationScope, SpeculationRuleSet> = {
  // Landing page: sell the catalog, soften the auth detour.
  home: buildSpeculationRules({
    prerender: ["/services*", "/products*", "/rescue*", "/vouchers/c/*"],
    prefetch: ["/booking*", "/login*", "/register*"],
  }),
  // Catalog browsing: the next click is almost always another category
  // tab, the rescue card, or the booking funnel (guests bounce to login,
  // so booking stays a prefetch).
  services: buildSpeculationRules({
    prerender: ["/services/*", "/rescue*", "/vouchers/c/*"],
    prefetch: [
      "/login*",
      "/register*",
      { match: "/booking*", eagerness: "moderate" },
    ],
  }),
  // Product catalog and detail pages are fully public; the cart is the
  // funnel exit and renders for guests too.
  products: buildSpeculationRules({
    prerender: ["/products/*", "/cart*", "/vouchers/c/*"],
    prefetch: ["/login*"],
  }),
  // Cart → checkout is the highest-intent hop in the shop; item rows link
  // back to public product pages.
  cart: buildSpeculationRules({
    prerender: ["/products/*"],
    prefetch: [
      "/products",
      "/login*",
      { match: "/checkout*", eagerness: "moderate" },
    ],
  }),
  // Only real anchors: back-to-cart and the catalog. The success hop is a
  // programmatic router.push to /orders/[id], which document rules can
  // never match.
  checkout: buildSpeculationRules({
    prefetch: ["/products*", "/cart*", "/vouchers*"],
  }),
  // Order list: hovering a row prerenders its detail page. Guest visits
  // render no order links, so the rule never fires signed out.
  orders: buildSpeculationRules({
    prerender: ["/orders/*"],
    prefetch: ["/products*"],
  }),
  // History tabs plus the real exit links (rebook, rescue, reorder).
  // `/history*` self-matches the bare tab too — comment/reply pagers link
  // to `/history?cm_<id>=N`, which `/history/*` would never catch.
  history: buildSpeculationRules({
    prefetch: [
      { match: "/history*", eagerness: "moderate" },
      { match: "/orders/*", eagerness: "moderate" },
      "/rescue*",
      "/services*",
      "/products*",
    ],
  }),
  // Post-booking destinations rendered by the success screen — plus the
  // page itself, whose review panels paginate via ?srv_page= / ?mrv_<id>=.
  booking: buildSpeculationRules({
    prefetch: [
      { match: "/booking*", eagerness: "moderate" },
      "/services*",
      "/account*",
      "/vouchers*",
    ],
  }),
  // Public emergency page: next hops are home, the catalog or the auth
  // wall for account holders.
  rescue: buildSpeculationRules({
    prefetch: ["/", "/services*", "/login*"],
  }),
  // Public tracking pages: exits are the shop and the rescue intake.
  track: buildSpeculationRules({
    prefetch: ["/", "/products*", "/rescue*"],
  }),
  // OTP lookup: before verifying there are no record links, after verifying
  // each row links into the public tracking page. Prefetch only — the list is
  // cookie-gated, so prerendering it would fetch a document that cannot
  // resolve anything signed out.
  lookup: buildSpeculationRules({
    prefetch: [{ match: "/track/*", eagerness: "moderate" }, "/rescue*", "/"],
  }),
  // The two auth forms point at each other; home is the fallback.
  login: buildSpeculationRules({
    prefetch: [{ match: "/register*", eagerness: "moderate" }, "/"],
  }),
  register: buildSpeculationRules({
    prefetch: [{ match: "/login*", eagerness: "moderate" }, "/"],
  }),
  account: buildSpeculationRules({
    prefetch: [{ match: "/account/*", eagerness: "moderate" }, "/"],
  }),
  // Voucher shelf plus detail pages. Public campaign details render
  // identically signed out — safe to prerender. The /page/N pager and
  // owner wallet details are cookie-gated, so they stay prefetch; the
  // `/vouchers` self-match keeps the back links warm.
  vouchers: buildSpeculationRules({
    prerender: ["/vouchers/c/*"],
    prefetch: [
      { match: "/vouchers/page/*", eagerness: "moderate" },
      { match: "/vouchers/w/*", eagerness: "moderate" },
      "/vouchers",
      "/booking*",
      "/products*",
      "/register*",
      "/login*",
      "/",
    ],
  }),
  // Staff workspaces: every sidebar entry lives under the section root.
  // Prefetch only — these screens run live polling, so prerendering them
  // would spin up discarded work.
  mechanic: buildSpeculationRules({
    prefetch: [{ match: "/mechanic/*", eagerness: "moderate" }, "/"],
  }),
  dispatch: buildSpeculationRules({
    prefetch: [{ match: "/dispatch/*", eagerness: "moderate" }, "/"],
  }),
  admin: buildSpeculationRules({
    prefetch: [{ match: "/admin/*", eagerness: "moderate" }, "/"],
  }),
};

export const SPECULATION_SCOPES = Object.keys(
  SCOPE_RULES,
) as SpeculationScope[];

export function speculationRulesForScope(
  scope: SpeculationScope,
): SpeculationRuleSet {
  return SCOPE_RULES[scope];
}
