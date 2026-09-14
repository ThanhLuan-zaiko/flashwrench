import { THEME_STORAGE_KEY } from "./theme.constants";

const INIT_SCRIPT = `(function(){try{var s=localStorage.getItem('${THEME_STORAGE_KEY}');var d=window.matchMedia('(prefers-color-scheme: dark)').matches;if(s==='dark'||(!s&&d)){document.documentElement.classList.add('dark')}else{document.documentElement.classList.remove('dark')}}catch(e){}})();`;

/**
 * Applies the saved (or OS) theme before first paint to avoid a flash
 * of the wrong theme. Rendered as the first child of <body>.
 */
export function ThemeInitScript() {
  return (
    // biome-ignore lint/security/noDangerouslySetInnerHtml: static first-paint theme script with no user input.
    <script id="theme-init" dangerouslySetInnerHTML={{ __html: INIT_SCRIPT }} />
  );
}
