import { NextResponse } from "next/server";
import { listAvailableMechanics } from "@/lib/mechanic/mechanic-directory.service";

function toNumberParam(value: string | null): number | undefined {
  if (value === null || value.trim() === "") return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : Number.NaN;
}

// Bookable mechanics for the customer picker and the "top rated"
// showcase. Public: guests shop without a session and the directory
// only carries storefront-safe fields (name, rating, jobs done, base
// coords — no contact or live position). ?lat=&lng= sorts
// nearest-first, ?limit= caps the directory page. Thin handler.
export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;

  try {
    const result = await listAvailableMechanics({
      lat: toNumberParam(params.get("lat")),
      lng: toNumberParam(params.get("lng")),
      limit: toNumberParam(params.get("limit")),
      liveRatings: true,
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
