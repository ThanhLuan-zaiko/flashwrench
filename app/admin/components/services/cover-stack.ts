// Gallery shown by the admin row cover stack: the saved gallery wins, the
// legacy single cover is only a fallback, and blank URLs never reach an
// <img> so rows can't render broken thumbnails.
export function coverStackImages(
  images: string[] | null | undefined,
  imageUrl: string,
): string[] {
  const gallery = Array.isArray(images)
    ? images.filter((url) => url.trim().length > 0)
    : [];
  if (gallery.length > 0) return gallery;
  const cover = imageUrl.trim();
  return cover ? [cover] : [];
}
