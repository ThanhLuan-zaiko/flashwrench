import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/authorization";
import { listDispatchRescues } from "@/lib/rescue/rescue-reader.service";

// Dispatcher rescue board: ?status=open|dispatched|accepted&cursor=.
// Cursor paging per status; switching tabs resets to page 1 client-side.
export async function GET(request: Request) {
  const { response, user } = await requireRole("dispatcher", "admin");
  if (response) return response;
  const url = new URL(request.url);
  try {
    const result = await listDispatchRescues(user, {
      status: url.searchParams.get("status") ?? undefined,
      cursor: url.searchParams.get("cursor"),
    });
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
        errors: { form: "Không tải được cứu hộ. Vui lòng thử lại." },
      },
      { status: 500 },
    );
  }
}
