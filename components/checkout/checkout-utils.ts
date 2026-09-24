import type { PublicUser } from "@/lib/auth/user.types";

export type AccountRecipient = {
  recipientName: string;
  phone: string;
};

// The checkout form locks the recipient to the signed-in account so the
// order always carries verified contact details.
export function accountRecipient(user: PublicUser | null): AccountRecipient {
  return {
    recipientName: user?.fullName ?? "",
    phone: user?.phone ?? "",
  };
}
