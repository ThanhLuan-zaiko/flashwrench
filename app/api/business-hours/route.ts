import { NextResponse } from "next/server";
import { getBusinessHoursPolicy } from "@/lib/shop/business-hours.service";

// Public working-hours window for the /booking form: the schedule hint
// and the submit-time check need the admin-tuned range, so guests get
// it without a login. Read failures degrade to "any hour" inside
// getBusinessHoursPolicy.
export async function GET() {
  const hours = await getBusinessHoursPolicy();
  return NextResponse.json(hours);
}
