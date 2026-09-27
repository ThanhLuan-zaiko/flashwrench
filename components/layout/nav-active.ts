// Active-state helper for the site header nav. Home matches exactly;
// every other item stays active on its own sub-routes.
export function isNavActive(currentPath: string, href: string): boolean {
  if (href === "/") return currentPath === "/";
  return currentPath === href || currentPath.startsWith(`${href}/`);
}
