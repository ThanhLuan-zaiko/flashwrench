import { NextResponse } from "next/server";
import { getShopProfile } from "@/lib/shop/shop-profile.service";

// Public storefront identity: hotline/address render in customer
// touchpoints without a login. Read failures degrade to empty defaults
// inside getShopProfile.
export async function GET() {
  const profile = await getShopProfile();
  return NextResponse.json(profile);
}
