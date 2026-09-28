import { NextResponse } from "next/server";
import { getPublicRescueTracking } from "@/lib/rescue/rescue-reader.service";

type RouteParams = { params: Promise<{ requestId: string }> };

// Public tracking for the requester: guests never log in, so the
// unguessable request id acts as the capability. The payload carries
// only journey progress — status, mechanic name, ETA — never customer
// identity fields.
export async function GET(_request: Request, { params }: RouteParams) {
  const { requestId } = await params;
  try {
    const result = await getPublicRescueTracking(requestId);
    if (!result.ok) {
      return NextResponse.json(
        { errors: result.errors },
        { status: result.status },
      );
    }
    return NextResponse.json({ tracking: result.data });
  } catch {
    return NextResponse.json(
      {
        errors: { form: "Không tải được tiến trình cứu hộ. Vui lòng thử lại." },
      },
      { status: 500 },
    );
  }
}
