import { describe, expect, test } from "bun:test";
import { servicePhotos } from "@/components/home/services/service-photos";

describe("servicePhotos", () => {
  test("puts the cover first, then the gallery", () => {
    expect(
      servicePhotos({ imageUrl: "/a.jpg", images: ["/b.jpg", "/c.jpg"] }),
    ).toEqual(["/a.jpg", "/b.jpg", "/c.jpg"]);
  });

  test("drops empty entries and repeats", () => {
    expect(
      servicePhotos({ imageUrl: "/a.jpg", images: ["", "/a.jpg", "/b.jpg"] }),
    ).toEqual(["/a.jpg", "/b.jpg"]);
  });

  test("returns nothing when the service has no photo", () => {
    expect(servicePhotos({ imageUrl: "", images: [] })).toEqual([]);
  });
});
