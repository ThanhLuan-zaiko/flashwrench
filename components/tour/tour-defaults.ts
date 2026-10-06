import type { Step } from "nextstepjs";

// Shared spotlight tuning for every page guide tour: a roomy pointer ring,
// card gap, enough scroll clearance for the 64px sticky header, and a few
// selector retries so lazily rendered anchors still resolve. Spread into
// each step in the feature `*.steps.ts` files.
export const TOUR_STEP_OPTIONS = {
  pointerPadding: 8,
  pointerRadius: 12,
  cardOffset: 16,
  scrollOffset: 80,
  selectorRetryAttempts: 5,
  selectorRetryDelay: 200,
} satisfies Partial<Step>;
