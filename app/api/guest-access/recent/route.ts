import { NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/auth/authorization";
import { readGuestId } from "@/lib/auth/guest-session";
import { listRecentGuestRecords } from "@/lib/guest-records/guest-records.service";
import type { RecentGuestRecords } from "@/lib/guest-records/guest-records.types";

const NO_STORE = { "Cache-Control": "no-store" };

// Read-only list of the anonymous jobs this browser filed, keyed by the
// fw_gid cookie — what lets a second tab find a booking or order placed in
// the first one. Signed-in visitors read their account history instead, so
// they always get an empty list here (claimed records are filtered anyway).
export async function GET() {
  try {
    const user = await authenticateRequest();
    if (user) {
      const empty: RecentGuestRecords = { records: [] };
      return NextResponse.json(empty, { headers: NO_STORE });
    }
    const records = await listRecentGuestRecords(await readGuestId());
    const body: RecentGuestRecords = { records };
    return NextResponse.json(body, { headers: NO_STORE });
  } catch (error) {
    console.error("[guest-access] recent list failed", error);
    return NextResponse.json(
      { errors: { form: "Không tải được đơn gần đây. Vui lòng thử lại." } },
      { status: 500, headers: NO_STORE },
    );
  }
}
