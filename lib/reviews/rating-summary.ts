// Pure rating aggregation shared by the review services. Only real 1..5
// star ratings count; the average keeps one decimal.
const MAX_STARS = 5;

export type RatingSummary = { ratingAvg: number; ratingCount: number };

export function summarizeRatings(ratings: number[]): RatingSummary {
  const valid = ratings.filter(
    (rating) => Number.isFinite(rating) && rating >= 1 && rating <= MAX_STARS,
  );
  if (valid.length === 0) return { ratingAvg: 0, ratingCount: 0 };
  const total = valid.reduce((sum, rating) => sum + rating, 0);
  return {
    ratingAvg: Math.round((total / valid.length) * 10) / 10,
    ratingCount: valid.length,
  };
}
