import type { Area } from "react-easy-crop";

// Canvas crop at the natural (full) resolution of the source image:
// the output keeps every pixel inside the crop area, never a
// downscaled preview. Browser-only (HTMLCanvasElement).

function loadImage(source: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Cannot load image."));
    image.src = source;
  });
}

function outputMime(sourceMime: string): { mime: string; quality: number } {
  if (sourceMime === "image/png" || sourceMime === "image/webp") {
    return { mime: sourceMime, quality: 0.92 };
  }
  return { mime: "image/jpeg", quality: 0.92 };
}

export type CroppedImage = {
  blob: Blob;
  width: number;
  height: number;
  mime: string;
};

export async function cropImageToBlob(
  imageSrc: string,
  crop: Area,
  sourceMime: string,
  rotation = 0,
): Promise<CroppedImage> {
  const image = await loadImage(imageSrc);
  const rotRad = (rotation * Math.PI) / 180;
  const cos = Math.abs(Math.cos(rotRad));
  const sin = Math.abs(Math.sin(rotRad));
  const boundWidth = cos * image.naturalWidth + sin * image.naturalHeight;
  const boundHeight = sin * image.naturalWidth + cos * image.naturalHeight;

  const safe = document.createElement("canvas");
  safe.width = Math.ceil(boundWidth);
  safe.height = Math.ceil(boundHeight);
  const safeCtx = safe.getContext("2d");
  if (!safeCtx) throw new Error("Canvas is not available.");
  safeCtx.translate(safe.width / 2, safe.height / 2);
  safeCtx.rotate(rotRad);
  safeCtx.drawImage(image, -image.naturalWidth / 2, -image.naturalHeight / 2);

  const output = document.createElement("canvas");
  output.width = Math.round(crop.width);
  output.height = Math.round(crop.height);
  const ctx = output.getContext("2d");
  if (!ctx) throw new Error("Canvas is not available.");
  ctx.drawImage(
    safe,
    crop.x,
    crop.y,
    crop.width,
    crop.height,
    0,
    0,
    output.width,
    output.height,
  );

  const { mime, quality } = outputMime(sourceMime);
  const blob = await new Promise<Blob | null>((resolve) =>
    output.toBlob(resolve, mime, quality),
  );
  if (!blob) throw new Error("Cannot encode cropped image.");
  return { blob, width: output.width, height: output.height, mime };
}
