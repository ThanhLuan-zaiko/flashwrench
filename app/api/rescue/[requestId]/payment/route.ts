import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/authorization";
import {
  mutationOriginError,
  readJsonObject,
  resultResponse,
  routeFailure,
} from "@/lib/http/workspace-route";
import { recordRescuePayment } from "@/lib/rescue/rescue-payment.service";

type RouteParams = { params: Promise<{ requestId: string }> };

// The assigned mechanic (or admin) records the customer's payment on a
// completed rescue: { method, amount?, confirmed, paymentId?, confirmCode? }.
export async function POST(request: Request, { params }: RouteParams) {
  const originError = mutationOriginError(request);
  if (originError) return originError;
  const { response, user } = await requireRole("mechanic", "admin");
  if (response) return response;
  const { requestId } = await params;

  const body = await readJsonObject(request);
  if (!body) {
    return NextResponse.json(
      { errors: { form: "Dữ liệu gửi lên không hợp lệ." } },
      { status: 400 },
    );
  }
  try {
    const result = await recordRescuePayment(user, requestId, body);
    return resultResponse(result, (payment) => ({ payment }), 201);
  } catch {
    return routeFailure(
      "Không ghi nhận được thanh toán. Vui lòng thử lại sau.",
    );
  }
}
