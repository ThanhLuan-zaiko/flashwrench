// OSM embed builder for shared chat fixes. No mocks, no database.
import { describe, expect, test } from "bun:test";
import { chatLocationEmbedUrl } from "@/lib/chat/chat-map";

describe("chatLocationEmbedUrl", () => {
  test("embeds the fix with a marker and bbox", () => {
    const url = chatLocationEmbedUrl({ lat: 10.76262, lng: 106.66017 });
    expect(url).toContain("openstreetmap.org/export/embed.html");
    expect(url).toContain("marker=10.76262,106.66017");
    expect(url).toContain("bbox=");
    expect(url).toContain("layer=mapnik");
  });

  test("clamps polar fixes inside the world bounds", () => {
    const url = chatLocationEmbedUrl({ lat: 90, lng: 180 });
    expect(url).toContain("marker=90,180");
    expect(url).not.toContain("NaN");
  });
});
