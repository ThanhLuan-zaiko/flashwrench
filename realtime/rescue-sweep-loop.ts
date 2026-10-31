// Rescue offer sweep, hosted inside the realtime gateway like the other
// loops. Offers last 30s and the mechanic browser normally expires them,
// so this tick only catches the offers whose browser went away. The global
// flag keeps one timer per process across hot reloads; the expiry CAS keeps
// overlapping ticks and replicas from double-expiring an offer.
import { sweepExpiredRescueOffers } from "@/lib/rescue/rescue-sweep.service";

const SWEEP_INTERVAL_MS = 5_000;

declare global {
  // eslint-disable-next-line no-var
  var rescueOfferSweepStarted: boolean | undefined;
}

async function sweepOnce(): Promise<void> {
  try {
    const expired = await sweepExpiredRescueOffers();
    if (expired > 0) {
      console.log(`[rescue] expired ${expired} stale offer(s)`);
    }
  } catch (error) {
    console.error("[rescue] offer sweep failed:", error);
  }
}

export function startRescueOfferSweepLoop(): void {
  if (globalThis.rescueOfferSweepStarted) return;
  globalThis.rescueOfferSweepStarted = true;
  setInterval(() => void sweepOnce(), SWEEP_INTERVAL_MS);
}
