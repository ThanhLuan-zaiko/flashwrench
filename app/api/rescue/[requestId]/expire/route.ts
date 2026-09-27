import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/authorization";
import { mutationOriginError } from "@/lib/http/workspace-route";
import { expireRescueOffer } from "@/lib/rescue/rescue-dispatch.service";

type RouteParams = { params: Promise<{ requestId: string }> };

// Expire a 30s offer: called by the assigned mechanic timer, the
// dispatcher monitor, or a sweep. Expired offers re-offer the next
// nearest mechanic automatically; empty queues stay open for humans.
export async function POST(request: Request, { params }: RouteParams) {
  const originError = mutationOriginError(request);
  if (originError) return originError;
  const { response } = await requireRole("mechanic", "dispatcher", "admin");
  if (response) return response;
  const { requestId } = await params;

  try {
    const result = await expireRescueOffer(requestId);
    return NextResponse.json(result);
  } catch {
    return NextResponse.json(
      {
        errors: { form: "Không xử lý hết hạn được. Vui lòng thử lại." },
      },
      { status: 500 },
    );
  }
}
