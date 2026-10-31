// Floating photo moved by useCursorPreview (320x200). Hidden until a service
// row with a photo is hovered by a mouse on a wide screen. Decorative, so it
// is hidden from assistive tech; the row link already names the service.
export function ServicePreview() {
  return (
    <div
      data-preview
      aria-hidden="true"
      className="pointer-events-none fixed top-0 left-0 z-30 hidden h-[200px] w-[320px] overflow-hidden rounded-lg bg-zinc-100 opacity-0 lg:block dark:bg-zinc-900"
    >
      {/* biome-ignore lint/performance/noImgElement: dynamic catalog cover swapped at hover time; next/image adds nothing here. */}
      <img alt="" className="h-full w-full object-cover" />
    </div>
  );
}
