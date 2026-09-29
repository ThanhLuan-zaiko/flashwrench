import { requireAuth } from "@/lib/auth/authorization";
import { resultResponse, routeFailure } from "@/lib/http/workspace-route";
import { getPartReviewEligibility } from "@/lib/reviews/part-review-eligibility.service";

type RouteParams = { params: Promise<{ slug: string }> };

// Tells the signed-in customer whether the product page may show the star
// rating form (delivered order with this part and no review yet).
export async function GET(_request: Request, { params }: RouteParams) {
  const { response, user } = await requireAuth();
  if (response) return response;
  const { slug } = await params;
  try {
    const result = await getPartReviewEligibility(user, slug);
    return resultResponse(result, (eligibility) => ({ eligibility }));
  } catch {
    return routeFailure(
      "Không kiểm tra được quyền đánh giá. Vui lòng thử lại sau.",
    );
  }
}
