// OSM Germany community tile server replaces the OSM tile endpoint:
// *.openstreetmap.org is blocked on some restricted networks while
// tile.openstreetmap.de stays reachable. Same OSM data and map style,
// keyless and free under the OSM tile usage policy.
export const TILE_SUBDOMAINS = "abc";

export const TILE_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

// Single style for both themes today; the dark flag stays so a dark
// variant can slot in later without touching the components.
export function tileUrlForTheme(_dark: boolean): string {
  return "https://{s}.tile.openstreetmap.de/{z}/{x}/{y}.png";
}
