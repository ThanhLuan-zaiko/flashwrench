import { requireRole } from "@/lib/auth/authorization";
import {
  mutationOriginError,
  resultResponse,
  routeFailure,
} from "@/lib/http/workspace-route";
import { issueRescuePaymentCode } from "@/lib/payments/payment-code.service";

type RouteParams = { params: Promise<{ requestId: string }> };

// Rotate the customer-facing cash confirmation code for this rescue.
export async function POST(request: Request, { params }: RouteParams) {
  const originError = mutationOriginError(request);
  if (originError) return originError;
  const { response, user } = await requireRole("mechanic", "admin");
  if (response) return response;
  const { requestId } = await params;
  try {
    const result = await issueRescuePaymentCode(user, requestId);
    return resultResponse(result, (data) => data, 201);
  } catch {
    return routeFailure("Không cấp được mã xác nhận. Vui lòng thử lại sau.");
  }
}
