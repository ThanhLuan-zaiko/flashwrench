// Product-page rating gate: a customer can rate a part only through a
// delivered order that contains it and has no part review yet. The write
// itself still goes through createOrderPartReview, which re-checks every
// rule, so this read only tells the product page which form to show.
import type { PublicUser } from "@/lib/auth/user.types";
import {
  listOrderItemRows,
  listOrderRowsByCustomer,
} from "@/lib/orders/orders.repository";
import { findPartIdBySlug } from "@/lib/parts/parts.repository";
import { isUuid } from "@/lib/validation";
import type { OrderPartReviewRow, PartReviewEligibility } from "./review.types";
import { type ReviewResult, toReviewItem } from "./review.types";
import { listOrderPartReviewRows } from "./reviews.repository";

// Only the most recent orders are scanned: enough for real shoppers while
// keeping the per-page-view read bounded.
export const ELIGIBILITY_ORDER_SCAN = 30;

function fail<T>(status: number, form: string): ReviewResult<T> {
  return { ok: false, status, errors: { form } };
}

function decodeSlug(slug: string): string | null {
  try {
    return decodeURIComponent(slug).trim() || null;
  } catch {
    return null;
  }
}

type OwnedPartOrder = {
  orderId: string;
  review: OrderPartReviewRow | null;
};

async function ownedPartOrder(
  orderId: string,
  partId: string,
): Promise<OwnedPartOrder | null> {
  const items = await listOrderItemRows(orderId);
  if (!items.some((item) => item.part_id === partId)) return null;
  const reviews = await listOrderPartReviewRows(orderId);
  return {
    orderId,
    review: reviews.find((row) => row.part_id === partId) ?? null,
  };
}

export async function getPartReviewEligibility(
  customer: PublicUser,
  slug: string,
): Promise<ReviewResult<PartReviewEligibility>> {
  const decoded = decodeSlug(slug);
  if (!decoded) return fail(400, "Sản phẩm không hợp lệ.");
  const partId = await findPartIdBySlug(decoded);
  if (!partId || !isUuid(partId)) return fail(404, "Không tìm thấy sản phẩm.");

  const orders = await listOrderRowsByCustomer(
    customer.id,
    ELIGIBILITY_ORDER_SCAN,
  );
  const delivered = orders.filter(
    (order) =>
      order.customer_id === customer.id && order.status === "delivered",
  );
  const owned = (
    await Promise.all(
      delivered.map((order) => ownedPartOrder(order.order_id, partId)),
    )
  ).filter((entry): entry is OwnedPartOrder => entry !== null);

  const open = owned.find((entry) => entry.review === null);
  if (open) {
    return {
      ok: true,
      data: { status: "eligible", orderId: open.orderId, partId },
    };
  }
  const latest = owned[0]?.review;
  if (latest) {
    return {
      ok: true,
      data: { status: "reviewed", review: toReviewItem(latest) },
    };
  }
  return { ok: true, data: { status: "not_purchased" } };
}
