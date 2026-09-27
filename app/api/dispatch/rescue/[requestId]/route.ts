import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/authorization";
import {
  mutationOriginError,
  readJsonObject,
} from "@/lib/http/workspace-route";
import { applyDispatchRescueAction } from "@/lib/rescue/rescue-dispatch-actions.service";

type RouteParams = { params: Promise<{ requestId: string }> };

// Dispatcher override: { action: "assign" + mechanicId, "cancel" + note,
// "expire-now", expectedUpdatedAt }. Thin handler: the service owns rules.
export async function PATCH(request: Request, { params }: RouteParams) {
  const originError = mutationOriginError(request);
  if (originError) return originError;
  const { response, user } = await requireRole("dispatcher", "admin");
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
    const result = await applyDispatchRescueAction(user, requestId, body);
    if (!result.ok) {
      return NextResponse.json(
        { errors: result.errors },
        { status: result.status },
      );
    }
    return NextResponse.json({ rescue: result.data });
  } catch {
    return NextResponse.json(
      {
        errors: { form: "Không cập nhật được cứu hộ. Vui lòng thử lại." },
      },
      { status: 500 },
    );
  }
}
