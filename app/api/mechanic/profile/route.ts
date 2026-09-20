import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/authorization";
import {
  mutationOriginError,
  readJsonObject,
  resultResponse,
  routeFailure,
} from "@/lib/http/workspace-route";
import {
  getMechanicPresence,
  updateMechanicProfilePresence,
} from "@/lib/mechanic/mechanic-profile.service";

export async function GET() {
  const { response, user } = await requireRole("mechanic");
  if (response) return response;
  try {
    const result = await getMechanicPresence(user);
    return resultResponse(result, (profile) => ({ profile }));
  } catch {
    return routeFailure("Không tải được hồ sơ thợ. Vui lòng thử lại sau.");
  }
}

export async function PATCH(request: Request) {
  const originError = mutationOriginError(request);
  if (originError) return originError;
  const { response, user } = await requireRole("mechanic");
  if (response) return response;

  const body = await readJsonObject(request);
  if (!body) {
    return NextResponse.json(
      { errors: { form: "Dữ liệu gửi lên không hợp lệ." } },
      { status: 400 },
    );
  }
  try {
    const result = await updateMechanicProfilePresence(user, body);
    return resultResponse(result, (profile) => ({ profile }));
  } catch {
    return routeFailure("Không cập nhật được hồ sơ. Vui lòng thử lại sau.");
  }
}
