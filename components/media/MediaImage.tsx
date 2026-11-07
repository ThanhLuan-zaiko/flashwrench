"use client";

import {
  type ImgHTMLAttributes,
  type ReactNode,
  useEffect,
  useRef,
  useState,
} from "react";

type MediaImageProps = Omit<
  ImgHTMLAttributes<HTMLImageElement>,
  "src" | "onError"
> & {
  src: string | null | undefined;
  // Bare icon or initials shown when there is no image or it never loads.
  fallback: ReactNode;
};

const RETRY_DELAY_MS = 1500;

function withRetryParam(src: string, attempt: number): string {
  if (attempt === 0) return src;
  return `${src}${src.includes("?") ? "&" : "?"}retry=${attempt}`;
}

// Uploaded image with one automatic retry: a dropped request (dev compile,
// tunnel hiccup) reconnects by itself, and a file that is really gone shows
// the fallback instead of the browser's broken-image box.
export function MediaImage({ src, fallback, alt, ...rest }: MediaImageProps) {
  if (!src) return <>{fallback}</>;
  // Keyed by src so a new image starts over with a fresh retry budget.
  return (
    <RetryingImage
      key={src}
      src={src}
      fallback={fallback}
      alt={alt}
      {...rest}
    />
  );
}

function RetryingImage({
  src,
  fallback,
  alt,
  ...rest
}: MediaImageProps & { src: string }) {
  const imgRef = useRef<HTMLImageElement>(null);
  const [attempt, setAttempt] = useState(0);
  const [failed, setFailed] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  function handleError() {
    if (attempt === 0) {
      timerRef.current = setTimeout(() => setAttempt(1), RETRY_DELAY_MS);
      return;
    }
    setFailed(true);
  }

  // A server-rendered <img> can fail before hydration attaches onError, so
  // check the element once on mount as well.
  // biome-ignore lint/correctness/useExhaustiveDependencies: mount-only probe.
  useEffect(() => {
    const img = imgRef.current;
    if (img?.complete && img.naturalWidth === 0) handleError();
  }, []);

  if (failed) return <>{fallback}</>;
  return (
    // biome-ignore lint/performance/noImgElement: dynamic uploads served immutable; next/image optimizer hop needs sharp for zero benefit.
    <img
      ref={imgRef}
      src={withRetryParam(src, attempt)}
      alt={alt ?? ""}
      onError={handleError}
      {...rest}
    />
  );
}
