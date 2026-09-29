import type { MechanicDirectoryItem } from "@/lib/mechanic/mechanic-directory.service";

export const TOP_MECHANICS_LIMIT = 3;

// Best rated mechanics first for the "Thợ được đánh giá cao" block. Mechanics
// with real reviews always outrank unrated ones; ties fall back to the number
// of reviews and then to completed jobs so the order stays stable.
export function rankTopMechanics(
  items: MechanicDirectoryItem[],
  limit = TOP_MECHANICS_LIMIT,
): MechanicDirectoryItem[] {
  return [...items]
    .sort((a, b) => {
      const ratedA = a.ratingCount > 0 ? 1 : 0;
      const ratedB = b.ratingCount > 0 ? 1 : 0;
      if (ratedA !== ratedB) return ratedB - ratedA;
      if (a.ratingAvg !== b.ratingAvg) return b.ratingAvg - a.ratingAvg;
      if (a.ratingCount !== b.ratingCount) return b.ratingCount - a.ratingCount;
      return b.completedJobs - a.completedJobs;
    })
    .slice(0, Math.max(0, limit));
}
