import { NextResponse } from "next/server";
import {
  listGuestRecords,
  readGuestAccessEmail,
} from "@/lib/guest-access/guest-access.service";

// Read-only: gated on the signed guest-access cookie, never on a session.
export async function GET() {
  try {
    const email = await readGuestAccessEmail();
    if (!email) {
      return NextResponse.json(
        {
          errors: { form: "Phiên tra cứu đã hết hạn. Vui lòng xác minh lại." },
        },
        { status: 401 },
      );
    }
    const result = await listGuestRecords(email);
    if (!result.ok) {
      return NextResponse.json(
        { errors: result.errors },
        { status: result.status },
      );
    }
    return NextResponse.json(result.data);
  } catch (error) {
    console.error("[guest-access] list failed", error);
    return NextResponse.json(
      { errors: { form: "Không tải được dữ liệu. Vui lòng thử lại." } },
      { status: 500 },
    );
  }
}
