import { NextResponse } from "next/server";
import { getBookingPolicy } from "@/lib/booking/booking-config.service";

// Public intake policy for the /booking form and the history cancel
// button: the datetime bounds and the lead-time hint need the admin-tuned
// values, so guests get them without a login. Read failures degrade to
// the code defaults inside getBookingPolicy.
export async function GET() {
  const policy = await getBookingPolicy();
  return NextResponse.json(policy);
}
