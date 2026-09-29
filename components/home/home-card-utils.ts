// UI-only helpers shared by the home showcase and testimonial cards.
import type { LandingReviewTargetKind } from "@/lib/home/landing-reviews.service";

// mechanics_by_id.skills vocabulary (see schema.cql) -> Vietnamese labels.
const SKILL_LABELS: Record<string, string> = {
  engine: "Động cơ",
  tire: "Lốp xe",
  battery: "Ắc quy",
  brake: "Phanh",
  ac: "Điều hòa",
  electrical: "Hệ thống điện",
  diagnostics: "Chẩn đoán",
};

export function skillLabel(skill: string): string {
  const trimmed = skill.trim();
  return SKILL_LABELS[trimmed.toLowerCase()] ?? trimmed;
}

// Avatar fallback: initials of the first and last word, so
// "Nguyễn Văn An" renders "NA". Single-word names take two letters.
export function initialsOf(name: string): string {
  const words = name.split(/\s+/).filter(Boolean);
  if (words.length === 0) return "FW";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return `${words[0][0]}${words[words.length - 1][0]}`.toUpperCase();
}

// Aggregate rating line for the showcase header: rounded to one decimal,
// unrated entries ignored.
export function averageRatingOf(ratings: number[]): number {
  const rated = ratings.filter((rating) => rating > 0);
  if (rated.length === 0) return 0;
  const total = rated.reduce((sum, rating) => sum + rating, 0);
  return Math.round((total / rated.length) * 10) / 10;
}

// "Đánh giá thợ Nguyễn Văn An" / "Đánh giá đơn hàng #a1b2c3d4" — what a
// real review was written about.
export function reviewTargetLabel(
  kind: LandingReviewTargetKind,
  targetName: string,
): string {
  const noun =
    kind === "mechanic"
      ? "thợ"
      : kind === "service"
        ? "dịch vụ"
        : kind === "part"
          ? "phụ tùng"
          : "đơn hàng";
  return `Đánh giá ${noun} ${targetName}`;
}
