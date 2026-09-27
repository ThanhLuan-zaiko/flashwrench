import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/authorization";
import { listMechanicRescues } from "@/lib/rescue/rescue-reader.service";

// Mechanic rescue inbox: offers currently assigned to me.
export async function GET() {
  const { response, user } = await requireRole("mechanic", "admin");
  if (response) return response;
  try {
    const result = await listMechanicRescues(user);
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
