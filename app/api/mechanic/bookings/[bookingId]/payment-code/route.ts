import { requireRole } from "@/lib/auth/authorization";
import {
  mutationOriginError,
  resultResponse,
  routeFailure,
} from "@/lib/http/workspace-route";
import { issueBookingPaymentCode } from "@/lib/payments/payment-code.service";

type RouteParams = { params: Promise<{ bookingId: string }> };

// Rotate the customer-facing cash confirmation code for this booking. The
// code itself is stored on the booking and only ever returned to the
// customer — the collector just gets { issued: true }.
export async function POST(request: Request, { params }: RouteParams) {
  const originError = mutationOriginError(request);
  if (originError) return originError;
  const { response, user } = await requireRole("mechanic", "admin");
  if (response) return response;
  const { bookingId } = await params;
  try {
    const result = await issueBookingPaymentCode(user, bookingId);
    return resultResponse(result, (data) => data, 201);
  } catch {
    return routeFailure("Không cấp được mã xác nhận. Vui lòng thử lại sau.");
  }
}
