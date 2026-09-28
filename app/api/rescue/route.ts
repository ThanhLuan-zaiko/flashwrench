import { NextResponse } from "next/server";
import { authenticateRequest, requireRole } from "@/lib/auth/authorization";
import {
  mutationOriginError,
  readJsonObject,
} from "@/lib/http/workspace-route";
import { createRescueRequest } from "@/lib/rescue/rescue.service";
import type { CreateRescueInput } from "@/lib/rescue/rescue.types";
import { listCustomerRescues } from "@/lib/rescue/rescue-reader.service";

// My rescue history: customers list only the requests their account
// filed. Guests have no partition, so the route stays role-gated.
export async function GET() {
  const { user, response } = await requireRole("customer");
  if (response) return response;
  try {
    const result = await listCustomerRescues(user);
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
        errors: {
          form: "Không tải được lịch sử cứu hộ. Vui lòng thử lại sau.",
        },
      },
      { status: 500 },
    );
  }
}

// Public rescue intake. Thin handler: parse input, call the service,
// shape the response. Guests need no session; a logged-in caller gets
// its user id linked so the request shows in their own history later.
export async function POST(request: Request) {
  const originError = mutationOriginError(request);
  if (originError) return originError;

  const body = await readJsonObject(request);
  if (!body) {
    return NextResponse.json(
      { errors: { form: "Dữ liệu gửi lên không hợp lệ." } },
      { status: 400 },
    );
  }

  const customer = await authenticateRequest();
  try {
    const result = await createRescueRequest(
      customer,
      body as CreateRescueInput,
    );
    if (!result.ok) {
      return NextResponse.json(
        { errors: result.errors },
        { status: result.status },
      );
    }
    return NextResponse.json({ request: result.data }, { status: 201 });
  } catch {
    return NextResponse.json(
      {
        errors: {
          form: "Không gửi được yêu cầu cứu hộ. Vui lòng thử lại sau.",
        },
      },
      { status: 500 },
    );
  }
}
