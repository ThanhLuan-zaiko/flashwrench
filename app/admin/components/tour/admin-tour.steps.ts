import type { Tour } from "nextstepjs";
import { ADMIN_CATALOG_TOURS } from "./admin-tour.catalog";
import { ADMIN_TOUR_NAMES } from "./admin-tour.names";
import { ADMIN_OPS_TOURS } from "./admin-tour.ops";

export { ADMIN_TOUR_NAMES };

// Full admin tour list for the workspace TourProvider.
export const ADMIN_TOUR_STEPS: Tour[] = [
  ...ADMIN_CATALOG_TOURS,
  ...ADMIN_OPS_TOURS,
];
