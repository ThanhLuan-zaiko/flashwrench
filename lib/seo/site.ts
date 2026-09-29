import type { Metadata } from "next";

export const SITE_NAME = "FlashWrench";
export const SITE_TITLE = "FlashWrench - Sửa xe lưu động tận nơi";
export const SITE_DESCRIPTION =
  "Đặt thợ sửa xe lưu động, cứu hộ khẩn cấp 24/7 với bảng giá minh bạch.";

// Absolute origin for Open Graph/Twitter cards: chat apps resolve image
// and link URLs against it, so previews only render fully on a real URL.
export function siteUrl(
  env: Record<string, string | undefined> = process.env,
): string {
  const raw = env.NEXT_PUBLIC_SITE_URL?.trim();
  if (!raw) return "http://localhost:3000";
  return raw.replace(/\/+$/, "");
}

export function pageOg(title: string, description: string) {
  return { title, description } as const;
}

// Site-wide defaults: every page inherits these and can override the
// openGraph fields it wants to specialize (see the public landing pages).
export function baseMetadata(
  env: Record<string, string | undefined> = process.env,
): Metadata {
  return {
    metadataBase: new URL(siteUrl(env)),
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    openGraph: {
      type: "website",
      locale: "vi_VN",
      siteName: SITE_NAME,
      title: SITE_TITLE,
      description: SITE_DESCRIPTION,
    },
    twitter: {
      card: "summary_large_image",
      title: SITE_TITLE,
      description: SITE_DESCRIPTION,
    },
  };
}
