import { formatVnd } from "@/app/admin/components/services/catalog-format";
import type { SelectOption } from "@/app/admin/components/services/category-filter";
import type { ServiceItem } from "@/lib/catalog/service-catalog.types";

// Map catalog services to the shared dropdown options. Labels keep the
// category, name and formatted price on one line so booking, rescue and
// admin pickers read identically.
export function toServiceSelectOptions(
  services: ServiceItem[],
): SelectOption[] {
  return services.map((service) => ({
    value: service.id,
    label: `${service.categoryName} — ${service.name} (${formatVnd(service.basePrice)})`,
  }));
}
