// Regenerate the static link-preview card: `bun scripts/gen-og-image.tsx`.
// Baking app/opengraph-image.png at authoring time keeps preview serving
// free (no runtime renderer, no font loading, fully cacheable).
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { ImageResponse } from "next/og";

const root = process.cwd();
const logo = readFileSync(join(root, "asset", "flashwrench.png"));
const logoData = `data:image/png;base64,${logo.toString("base64")}`;

const fonts: {
  name: string;
  data: Buffer;
  weight: 400 | 700;
  style: "normal";
}[] = [];
for (const [file, weight] of [
  ["BeVietnamPro-Regular.ttf", 400],
  ["BeVietnamPro-Bold.ttf", 700],
] as const) {
  try {
    fonts.push({
      name: "Be Vietnam Pro",
      data: readFileSync(join(root, "asset", "fonts", file)),
      weight,
      style: "normal",
    });
  } catch {
    // Optional: fall back to the bundled default font.
  }
}

const response = new ImageResponse(
  <div
    style={{
      width: "100%",
      height: "100%",
      display: "flex",
      alignItems: "center",
      backgroundColor: "#09090b",
      padding: "64px",
      fontFamily: fonts.length ? "Be Vietnam Pro" : "sans-serif",
    }}
  >
    <div style={{ display: "flex", alignItems: "center", gap: 56 }}>
      {/* Mascot sits on a subtle plate so the white fur still reads on
          the dark card. */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: 340,
          height: 340,
          borderRadius: 44,
          border: "2px solid #3f3f46",
          backgroundColor: "#18181b",
        }}
      >
        {/* biome-ignore lint/performance/noImgElement: data-URL logo inside an OG image template; next/image is unavailable here. */}
        <img src={logoData} width={290} height={290} alt="" />
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 26 }}>
        <div
          style={{
            fontSize: 76,
            fontWeight: 700,
            color: "#fafafa",
            letterSpacing: -1,
          }}
        >
          FlashWrench
        </div>
        <div style={{ fontSize: 38, color: "#d4d4d8", fontWeight: 400 }}>
          Sửa xe lưu động tận nơi
        </div>
        <div style={{ display: "flex", gap: 14, marginTop: 10 }}>
          {["Cứu hộ 24/7", "Giá minh bạch", "Thợ tới tận nơi"].map((label) => (
            <div
              key={label}
              style={{
                fontSize: 24,
                color: "#e4e4e7",
                border: "2px solid #3f3f46",
                borderRadius: 999,
                padding: "9px 20px",
              }}
            >
              {label}
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>,
  { width: 1200, height: 630, fonts },
);

const target = join(root, "app", "opengraph-image.png");
writeFileSync(target, Buffer.from(await response.arrayBuffer()));
console.log(`wrote ${target}`);
