import { describe, expect, test } from "bun:test";
import { baseMetadata, pageOg, SITE_NAME, siteUrl } from "@/lib/seo/site";

describe("siteUrl", () => {
  test("defaults to localhost for dev", () => {
    expect(siteUrl({})).toBe("http://localhost:3000");
  });

  test("trims whitespace and strips trailing slashes", () => {
    expect(siteUrl({ NEXT_PUBLIC_SITE_URL: " https://fw.vn/ " })).toBe(
      "https://fw.vn",
    );
  });
});

describe("baseMetadata", () => {
  test("produces an absolute metadataBase from the site URL", () => {
    const meta = baseMetadata({ NEXT_PUBLIC_SITE_URL: "https://fw.vn" });
    expect(meta.metadataBase?.toString()).toBe("https://fw.vn/");
  });

  test("carries Open Graph and Twitter card fields chat apps read", () => {
    const meta = baseMetadata({});
    const og = meta.openGraph as {
      type?: string;
      locale?: string;
      siteName?: string;
    } | null;
    const twitter = meta.twitter as { card?: string } | null;
    expect(og?.type).toBe("website");
    expect(og?.locale).toBe("vi_VN");
    expect(og?.siteName).toBe(SITE_NAME);
    expect(twitter?.card).toBe("summary_large_image");
    expect(typeof meta.title).toBe("string");
    expect(typeof meta.description).toBe("string");
  });
});

describe("pageOg", () => {
  test("pairs title with description for per-page overrides", () => {
    expect(pageOg("A | B", "desc")).toEqual({
      title: "A | B",
      description: "desc",
    });
  });
});
