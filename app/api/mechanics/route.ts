import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/authorization";
import { listAvailableMechanics } from "@/lib/mechanic/mechanic-directory.service";

function toNumberParam(value: string | null): number | undefined {
  if (value === null || value.trim() === "") return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : Number.NaN;
}

// Bookable mechanics for the customer picker. ?lat=&lng= sorts
// nearest-first, ?limit= caps the directory page. Thin handler.
export async function GET(request: Request) {
  const { response } = await requireAuth();
  if (response) return response;
  const params = new URL(request.url).searchParams;

  try {
    const result = await listAvailableMechanics({
      lat: toNumberParam(params.get("lat")),
      lng: toNumberParam(params.get("lng")),
      limit: toNumberParam(params.get("limit")),
    });
    if (!result.ok) {
      return NextResponse.json(
        { errors: result.errors },
        { status: result.status },
      );
    }
    return NextResponse.json({ mechanics: result.data });
  } catch {
    return NextResponse.json(
      {
        errors: { form: "Không tải được danh sách thợ. Vui lòng thử lại sau." },
      },
      { status: 500 },
    );
  }
}
