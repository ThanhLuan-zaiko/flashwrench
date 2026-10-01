import { NextResponse } from "next/server";
import { readGuestAccessEmail } from "@/lib/guest-access/guest-access.service";
import { isGuestRecordType } from "@/lib/guest-access/guest-access.types";
import { readGuestInvoice } from "@/lib/guest-access/guest-invoice.service";
import { isUuid } from "@/lib/validation";

// Read-only invoice for one anonymous record. Ownership is checked inside
// readGuestInvoice, so an id from another address yields the same 404 as an
// id that does not exist.
export async function GET(request: Request) {
  try {
    const params = new URL(request.url).searchParams;
    const type = params.get("type");
    const id = params.get("id");

    if (!isGuestRecordType(type) || !isUuid(id ?? "")) {
      return NextResponse.json(
        { errors: { form: "Tham số không hợp lệ." } },
        { status: 400 },
      );
    }

    const email = await readGuestAccessEmail();
    if (!email) {
      return NextResponse.json(
        {
          errors: { form: "Phiên tra cứu đã hết hạn. Vui lòng xác minh lại." },
        },
        { status: 401 },
      );
    }

    const result = await readGuestInvoice(email, type, id as string);
    if (!result.ok) {
      return NextResponse.json(
        { errors: result.errors },
        { status: result.status },
      );
    }
    return NextResponse.json(result.data);
  } catch (error) {
    console.error("[guest-access] invoice failed", error);
    return NextResponse.json(
      { errors: { form: "Không tải được hóa đơn. Vui lòng thử lại." } },
      { status: 500 },
    );
  }
}
