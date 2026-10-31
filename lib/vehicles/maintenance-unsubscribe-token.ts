// Signed opt-out token for maintenance reminder emails. Pure: the signing
// secret is passed in, so the same code runs in tests and in the route.
import { createHmac, timingSafeEqual } from "node:crypto";

export function unsubscribeToken(userId: string, secret: string): string {
  return createHmac("sha256", secret)
    .update(`maintenance-optout:${userId}`)
    .digest("hex");
}

export function verifyUnsubscribeToken(
  userId: string,
  token: string,
  secret: string,
): boolean {
  const expected = Buffer.from(unsubscribeToken(userId, secret));
  const given = Buffer.from(token);
  return expected.length === given.length && timingSafeEqual(expected, given);
}
