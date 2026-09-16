// Shared thin monochrome scrollbar for the whole webapp. Pure Tailwind
// arbitrary properties, so globals.css stays exactly 2 lines and no
// custom CSS is needed. Import SCROLLBAR_CLASSES into every scroll
// container (sidebars, tab strips, dialogs, dropdowns) plus the <html>
// shell for one consistent look in light and dark themes.
export const SCROLLBAR_CLASSES =
  "[scrollbar-width:thin] [scrollbar-color:#a1a1aa_transparent] hover:[scrollbar-color:#71717a_transparent] dark:[scrollbar-color:#52525b_transparent] dark:hover:[scrollbar-color:#71717a_transparent]";
