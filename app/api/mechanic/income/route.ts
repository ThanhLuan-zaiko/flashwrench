import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/authorization";
import { getMechanicIncome } from "@/lib/mechanic/mechanic-income.service";

// Revenue numbers plus the transaction history (?limit= caps the list).
export async function GET(request: Request) {
  const { response, user } = await requireRole("mechanic");
  if (response) return response;
  const limit = new URL(request.url).searchParams.get("limit");
  try {
    const result = await getMechanicIncome(user.id, {
      limit: limit === null ? undefined : Number(limit),
    });
    if (!result.ok) {
      return NextResponse.json(
        { errors: result.errors },
        { status: result.status },
      );
    }
    return NextResponse.json({
      summary: result.data.summary,
      entries: result.data.entries,
      truncated: result.data.truncated,
    });
  } catch {
    return NextResponse.json(
      { errors: { form: "Không tải được thu nhập. Vui lòng thử lại sau." } },
      { status: 500 },
    );
  }
}
