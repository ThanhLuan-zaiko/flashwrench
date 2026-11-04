import { canonicalSlug, decodeSlugParam } from "./canonical-slug";
import { listPublicCatalog } from "./public-catalog.service";

// Where a /services/[slug] URL should really point. Tabs take a category slug,
// but links carrying a service slug are already out in the wild, so those land
// on the service's category. Returns null when the URL is already correct or
// the slug is unknown (the screen then shows its guidance panel), and on any
// catalog failure, since a redirect is only a convenience.
export async function resolveServiceTabRedirect(
  rawSlug: string,
): Promise<string | null> {
  try {
    const slug = canonicalSlug(rawSlug);
    const result = await listPublicCatalog();
    if (!result.ok) return null;
    const { categories, services } = result.data;
    const service = services.find((item) => item.slug === slug);
    const owner = service
      ? categories.find((item) => item.id === service.categoryId)
      : categories.find((item) => item.slug === slug);
    if (!owner || owner.slug === decodeSlugParam(rawSlug)) return null;
    return owner.slug;
  } catch {
    return null;
  }
}
