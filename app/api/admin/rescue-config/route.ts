import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/authorization";
import {
  mutationOriginError,
  readJsonObject,
} from "@/lib/http/workspace-route";
import {
  getDispatchConfig,
  updateDispatchConfig,
} from "@/lib/rescue/rescue-config.service";

// Admin SLA tuning for rescue auto-dispatch. GET returns live values or
// code defaults when never saved; PATCH validates ranges (seconds wire).
export async function GET() {
  const { response } = await requireRole("admin");
  if (response) return response;
  try {
    const config = await getDispatchConfig();
    return NextResponse.json({ config });
  } catch {
    return NextResponse.json(
      {
        errors: { form: "Không tải được cấu hình. Vui lòng thử lại." },
      },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request) {
  const originError = mutationOriginError(request);
  if (originError) return originError;
  const { response, user } = await requireRole("admin");
  if (response) return response;

  const body = await readJsonObject(request);
  if (!body) {
    return NextResponse.json(
      { errors: { form: "Dữ liệu gửi lên không hợp lệ." } },
      { status: 400 },
    );
  }

  try {
    const result = await updateDispatchConfig(user, body);
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
        errors: { form: "Không lưu được cấu hình. Vui lòng thử lại." },
      },
      { status: 500 },
    );
  }
}
