import { redirect } from "next/navigation";

export default function DispatchOrdersPage() {
  redirect("/dispatch/orders/pending");
}
