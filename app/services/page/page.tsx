import { redirect } from "next/navigation";

// The literal `page` segment without a number would otherwise reach the
// [slug] branch as an unknown category — send it to the list root.
export default function ServicesPageSegment() {
  redirect("/services");
}
