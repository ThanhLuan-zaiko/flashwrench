import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/authorization";
import {
  mutationOriginError,
  readJsonObject,
} from "@/lib/http/workspace-route";
import { applyRescueMechanicAction } from "@/lib/rescue/rescue-mechanic.service";
import { getRescueDetail } from "@/lib/rescue/rescue-reader.service";

type RouteParams = { params: Promise<{ requestId: string }> };

// Staff detail for parallel monitoring plus the filing customer's own
// view: dispatcher/admin see every rescue, mechanics only assigned
// offers, and customers only requests their account filed.
export async function GET(_request: Request, { params }: RouteParams) {
  const { response, user } = await requireRole(
    "customer",
    "mechanic",
    "dispatcher",
    "admin",
  );
  if (response) return response;
  const { requestId } = await params;
  try {
    const result = await getRescueDetail(user, requestId);
    if (!result.ok) {
      return NextResponse.json(
        { errors: result.errors },
        { status: result.status },
      );
    }
    return NextResponse.json(result.data);
  } catch {
    return NextResponse.json(
      {
        errors: { form: "Không tải được yêu cầu cứu hộ. Vui lòng thử lại." },
      },
      { status: 500 },
    );
  }
}

// Mechanic answers the 30s offer: { action: "accept" | "decline" }.
// A decline triggers an immediate re-offer to the next nearest mechanic.
export async function PATCH(request: Request, { params }: RouteParams) {
  const originError = mutationOriginError(request);
  if (originError) return originError;
  const { response, user } = await requireRole("mechanic");
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
    const result = await applyRescueMechanicAction(
      user.id,
      requestId,
      body.action,
    );
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
        errors: { form: "Không cập nhật được yêu cầu. Vui lòng thử lại." },
      },
      { status: 500 },
    );
  }
}
