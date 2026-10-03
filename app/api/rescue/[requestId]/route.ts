import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/authorization";
import {
  mutationOriginError,
  readJsonObject,
} from "@/lib/http/workspace-route";
import { cancelCustomerRescue } from "@/lib/rescue/rescue-customer-actions.service";
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

// Two writers share this route: the filing customer may send
// { action: "cancel", note } while no mechanic is on the road, and the
// assigned mechanic answers the 30s offer or drives the journey with
// { action: "accept" | "decline" | "depart" | "arrive" | "complete" }.
export async function PATCH(request: Request, { params }: RouteParams) {
  const originError = mutationOriginError(request);
  if (originError) return originError;

  const body = await readJsonObject(request);
  if (!body) {
    return NextResponse.json(
      { errors: { form: "Dữ liệu gửi lên không hợp lệ." } },
      { status: 400 },
    );
  }
  const { requestId } = await params;

  try {
    if (body.action === "cancel") {
      const { response, user } = await requireRole("customer");
      if (response) return response;
      const result = await cancelCustomerRescue(user, requestId, body.note);
      if (!result.ok) {
        return NextResponse.json(
          { errors: result.errors },
          { status: result.status },
        );
      }
      return NextResponse.json({ rescue: result.data });
    }

    const { response, user } = await requireRole("mechanic");
    if (response) return response;
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
