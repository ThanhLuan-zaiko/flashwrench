import { redirect } from "next/navigation";

export default function DispatchBookingsPage() {
  redirect("/dispatch/bookings/pending");
}
