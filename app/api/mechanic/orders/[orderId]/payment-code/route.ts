import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/authorization";
import { mutationOriginError, routeFailure } from "@/lib/http/workspace-route";
import { issueOrderPaymentCode } from "@/lib/payments/payment-code.service";

type RouteParams = { params: Promise<{ orderId: string }> };

// Rotate the customer-facing COD confirmation code for a delivery order the
// mechanic is carrying. Stored on the order row; the customer reads it from
// their order detail — the courier only ever gets { issued: true }.
export async function POST(request: Request, { params }: RouteParams) {
  const originError = mutationOriginError(request);
  if (originError) return originError;
  const { response, user } = await requireRole("mechanic", "admin");
  if (response) return response;
  const { orderId } = await params;
  try {
    const result = await issueOrderPaymentCode(user, orderId);
    if (!result.ok) {
      return NextResponse.json(
        { errors: result.errors },
        { status: result.status },
      );
    }
    return NextResponse.json(result.data, { status: 201 });
  } catch {
    return routeFailure("Không cấp được mã xác nhận. Vui lòng thử lại sau.");
  }
}
