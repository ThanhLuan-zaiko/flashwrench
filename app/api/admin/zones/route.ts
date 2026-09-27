import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/authorization";
import {
  mutationOriginError,
  readJsonObject,
} from "@/lib/http/workspace-route";
import { createZone, listZones } from "@/lib/zones/zone.service";

// Admin zone directory: list every zone plus create. Thin handlers;
// validation and role checks live in the service.
export async function GET() {
  const { response, user } = await requireRole("admin");
  if (response) return response;
  try {
    const result = await listZones(user);
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
        errors: { form: "Không tải được khu vực. Vui lòng thử lại." },
      },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
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
    const result = await createZone(user, body);
    if (!result.ok) {
      return NextResponse.json(
        { errors: result.errors },
        { status: result.status },
      );
    }
    return NextResponse.json(result.data, { status: 201 });
  } catch {
    return NextResponse.json(
      {
        errors: { form: "Không tạo được khu vực. Vui lòng thử lại." },
      },
      { status: 500 },
    );
  }
}
