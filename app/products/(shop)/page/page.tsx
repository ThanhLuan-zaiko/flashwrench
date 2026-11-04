import { redirect } from "next/navigation";

// The literal `page` segment without a number would otherwise reach the
// [slug] product detail as the slug "page" — send it to the shelf root.
export default function ProductsPageSegment() {
  redirect("/products");
}
