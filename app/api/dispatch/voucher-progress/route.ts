import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/authorization";
import { listNearMilestones } from "@/lib/vouchers/auto-rule.service";

export async function GET() {
  const { response } = await requireRole("dispatcher", "admin");
  if (response) return response;
  try {
    const result = await listNearMilestones();
    if (!result.ok) {
      return NextResponse.json(
        { errors: result.errors },
        { status: result.status },
      );
    }
    return NextResponse.json(result.data);
  } catch {
    return NextResponse.json(
      { errors: { form: "Không tải được tiến độ khách hàng." } },
      { status: 500 },
    );
  }
}
