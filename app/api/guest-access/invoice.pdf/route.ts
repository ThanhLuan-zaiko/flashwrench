import { NextResponse } from "next/server";
import { readGuestAccessEmail } from "@/lib/guest-access/guest-access.service";
import { isGuestRecordType } from "@/lib/guest-access/guest-access.types";
import { readGuestInvoice } from "@/lib/guest-access/guest-invoice.service";
import { invoiceFileName, renderInvoicePdf } from "@/lib/pdf/invoice-pdf";
import { isUuid } from "@/lib/validation";

// Binary download of the same document the JSON invoice route returns.
// Ownership is settled inside readGuestInvoice, so an id from another address
// yields the same 404 as a missing one — the error path is JSON, never a PDF,
// so a failure cannot be mistaken for a valid document.
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

    const bytes = await renderInvoicePdf(result.data);
    return new NextResponse(new Uint8Array(bytes), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${invoiceFileName(result.data)}"`,
        "Content-Length": String(bytes.byteLength),
        // The document is derived from live data, so a proxy must not serve
        // a stale copy after a status change.
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    console.error("[guest-access] invoice pdf failed", error);
    return NextResponse.json(
      { errors: { form: "Không tạo được file hóa đơn. Vui lòng thử lại." } },
      { status: 500 },
    );
  }
}
