// Generates the flat isometric SVG illustrations in public/images/isometric.
// Run with `bun scripts/generate-isometric.ts [outputDir]`. Drawings are built
// from axis-aligned boxes and vertical cylinders, projected at 30 degrees.
// Parts are painted in call order, so draw parts behind others first.

import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

type Vec3 = [number, number, number];
type Point = { x: number; y: number };

const NAVY_DEEP = "#0F1E33";
const NAVY = "#1E3A5F";
const SKY = "#8FB3D9";
const ORANGE = "#F97316";
const ORANGE_LIGHT = "#FDBA74";
const KRAFT = "#E2C9A0";
const PAPER = "#F4F4F5";
const ZINC = "#D4D4D8";
const GRAPHITE = "#3F3F46";
const WHITE = "#FFFFFF";

const COS30 = Math.cos(Math.PI / 6);
const RING_SEGMENTS = 40;
const MARGIN = 4;
const SHADOW_OPACITY = 0.16;

// World x runs toward the lower right, world y toward the lower left, z is up.
function project([x, y, z]: Vec3): Point {
  return { x: (x - y) * COS30, y: (x + y) * 0.5 - z };
}

function parseHex(hex: string): number[] {
  const value = Number.parseInt(hex.slice(1), 16);
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
}

function mix(hex: string, target: string, amount: number): string {
  const from = parseHex(hex);
  const to = parseHex(target);
  const channels = from.map((c, i) => Math.round(c + (to[i] - c) * amount));
  return `#${channels.map((c) => c.toString(16).padStart(2, "0")).join("")}`;
}

// Left faces (+y) take a light shade, right faces (+x) the darkest, top keeps base.
function shades(base: string) {
  return {
    top: base,
    left: mix(base, NAVY_DEEP, 0.14),
    right: mix(base, NAVY_DEEP, 0.3),
  };
}

function ringPoints(cx: number, cy: number, z: number, radius: number): Vec3[] {
  return Array.from({ length: RING_SEGMENTS }, (_, i): Vec3 => {
    const angle = (i / RING_SEGMENTS) * Math.PI * 2;
    return [cx + radius * Math.cos(angle), cy + radius * Math.sin(angle), z];
  });
}

const fmt = (n: number): string => Number(n.toFixed(2)).toString();

class Scene {
  private readonly parts: string[] = [];
  private readonly bounds = {
    minX: Number.POSITIVE_INFINITY,
    minY: Number.POSITIVE_INFINITY,
    maxX: Number.NEGATIVE_INFINITY,
    maxY: Number.NEGATIVE_INFINITY,
  };

  private polygon(points: Vec3[], fill: string, opacity?: number): void {
    const screen = points.map(project);
    for (const p of screen) {
      this.bounds.minX = Math.min(this.bounds.minX, p.x);
      this.bounds.minY = Math.min(this.bounds.minY, p.y);
      this.bounds.maxX = Math.max(this.bounds.maxX, p.x);
      this.bounds.maxY = Math.max(this.bounds.maxY, p.y);
    }
    // Same-colour stroke hides anti-aliasing seams between adjacent faces.
    const paint =
      opacity === undefined
        ? `fill="${fill}" stroke="${fill}" stroke-width="0.3" stroke-linejoin="round"`
        : `fill="${fill}" fill-opacity="${opacity}"`;
    const path = screen.map((p) => `${fmt(p.x)},${fmt(p.y)}`).join(" ");
    this.parts.push(`  <polygon points="${path}" ${paint}/>`);
  }

  // Flat footprint on the ground plane, used under objects.
  shadowBox([x, y, z]: Vec3, [w, d]: [number, number]): void {
    this.polygon(
      [
        [x, y, z],
        [x + w, y, z],
        [x + w, y + d, z],
        [x, y + d, z],
      ],
      NAVY_DEEP,
      SHADOW_OPACITY,
    );
  }

  shadowDisc(center: Vec3, radius: number): void {
    const [cx, cy, z] = center;
    this.polygon(ringPoints(cx, cy, z, radius), NAVY_DEEP, SHADOW_OPACITY);
  }

  box(at: Vec3, size: Vec3, base: string): void {
    const [x, y, z] = at;
    const [w, d, h] = size;
    const c = shades(base);
    const x1 = x + w;
    const y1 = y + d;
    const z1 = z + h;
    this.polygon(
      [
        [x, y1, z],
        [x1, y1, z],
        [x1, y1, z1],
        [x, y1, z1],
      ],
      c.left,
    );
    this.polygon(
      [
        [x1, y, z],
        [x1, y1, z],
        [x1, y1, z1],
        [x1, y, z1],
      ],
      c.right,
    );
    this.polygon(
      [
        [x, y, z1],
        [x1, y, z1],
        [x1, y1, z1],
        [x, y1, z1],
      ],
      c.top,
    );
  }

  // Flat disc lying on a horizontal plane, drawn as its top face only.
  disc(center: Vec3, radius: number, base: string): void {
    const [cx, cy, z] = center;
    this.polygon(ringPoints(cx, cy, z, radius), base);
  }

  // Vertical cylinder. Only sides facing the viewer are drawn.
  cylinder(at: Vec3, radius: number, height: number, base: string): void {
    const [cx, cy, z] = at;
    const c = shades(base);
    const bottom = ringPoints(cx, cy, z, radius);
    const top = ringPoints(cx, cy, z + height, radius);
    for (let i = 0; i < RING_SEGMENTS; i++) {
      const next = (i + 1) % RING_SEGMENTS;
      const mid = ((i + 0.5) / RING_SEGMENTS) * Math.PI * 2;
      const nx = Math.cos(mid);
      const ny = Math.sin(mid);
      if (nx + ny <= 0) continue;
      const t = Math.min(1, Math.max(0, nx / (nx + ny)));
      this.polygon(
        [bottom[i], bottom[next], top[next], top[i]],
        mix(c.left, c.right, t),
      );
    }
    this.polygon(top, c.top);
  }

  toSvg(): string {
    const { minX, minY, maxX, maxY } = this.bounds;
    const x = minX - MARGIN;
    const y = minY - MARGIN;
    const w = maxX - minX + MARGIN * 2;
    const h = maxY - minY + MARGIN * 2;
    const view = `${fmt(x)} ${fmt(y)} ${fmt(w)} ${fmt(h)}`;
    return [
      `<svg xmlns="http://www.w3.org/2000/svg" width="${fmt(w)}" height="${fmt(h)}" viewBox="${view}" fill="none" aria-hidden="true">`,
      ...this.parts,
      "</svg>",
      "",
    ].join("\n");
  }
}

// Campaign hero: a gift box with a ticket lying in front.
function gift(s: Scene): void {
  s.shadowBox([-1, -1, 0], [30, 26]);
  s.shadowBox([32, 16, 0], [25, 15]);
  s.box([0, 0, 0], [28, 24, 18], PAPER);
  s.box([-1, -1, 18], [30, 26, 6], ORANGE);
  s.box([13, -1, 24], [4, 26, 0.6], WHITE);
  s.disc([11, 12, 24.6], 3.2, WHITE);
  s.disc([17, 12, 24.6], 3.2, WHITE);
  s.cylinder([14, 12, 24.6], 1.4, 1.2, ORANGE_LIGHT);
  s.box([31, 16, 0], [24, 14, 1.6], ORANGE_LIGHT);
  s.box([47, 16, 1.6], [1, 14, 0.2], NAVY);
}

// Step 1: a membership card for the customer account.
function idCard(s: Scene): void {
  s.shadowBox([1, 1, 0], [36, 22]);
  s.box([0, 0, 0], [36, 22, 2], NAVY);
  s.box([4, 4, 2], [11, 11, 0.8], PAPER);
  s.cylinder([9.5, 8.5, 2.8], 2.2, 2.2, SKY);
  s.box([18, 5, 2], [14, 2, 0.8], SKY);
  s.box([18, 9, 2], [10, 2, 0.8], SKY);
  s.box([27, 4, 2], [5, 5, 0.8], ORANGE);
  s.box([4, 18, 2], [28, 2, 0.8], SKY);
}

// Step 2: a calendar with one booked day.
function calendar(s: Scene): void {
  s.shadowBox([-1, -1, 0], [32, 28]);
  s.box([0, 0, 0], [30, 26, 3], PAPER);
  s.box([0, 0, 3], [30, 7, 1.2], NAVY);
  s.cylinder([7, 2, 4.2], 1.4, 4, GRAPHITE);
  s.cylinder([23, 2, 4.2], 1.4, 4, GRAPHITE);
  for (let col = 0; col < 3; col++) {
    for (let row = 0; row < 3; row++) {
      const booked = col === 1 && row === 1;
      s.box(
        [3 + col * 9, 10 + row * 5, 3],
        [6, 3, 0.6],
        booked ? ORANGE : ZINC,
      );
    }
  }
}

// Step 3: a phone whose wallet shows a voucher.
function walletPhone(s: Scene): void {
  s.shadowBox([0, 3, 0], [15, 6]);
  s.box([0, 4, 0], [14, 4, 30], NAVY);
  s.box([1.5, 8, 2.5], [11, 0.4, 25], PAPER);
  s.box([3, 8.4, 11], [8, 0.5, 11], ORANGE);
  s.box([6, 8.4, 27], [2, 0.5, 0.8], GRAPHITE);
}

// Products: a sealed box with a genuine-product label.
function package_(s: Scene): void {
  s.shadowBox([-1, -1, 0], [30, 30]);
  s.box([0, 0, 0], [28, 28, 16], KRAFT);
  s.box([12, 0, 16], [4, 28, 0.4], PAPER);
  s.box([28, 6, 6], [0.4, 12, 8], ORANGE);
}

// Products: a delivery van, cargo box plus cabin.
function van(s: Scene): void {
  s.shadowBox([-1, -2, 0], [42, 20]);
  s.cylinder([7, -1, 0], 4.5, 4, GRAPHITE);
  s.cylinder([30, -1, 0], 4.5, 4, GRAPHITE);
  s.box([0, 0, 4], [26, 16, 16], NAVY);
  s.box([0, 16, 10], [26, 0.5, 2], ORANGE);
  s.box([26, 0, 4], [10, 16, 11], ORANGE);
  s.box([29, 16, 9], [5, 0.5, 4], SKY);
  s.box([36, 3, 9], [0.5, 10, 4], SKY);
  s.cylinder([7, 17, 0], 4.5, 4, GRAPHITE);
  s.cylinder([30, 17, 0], 4.5, 4, GRAPHITE);
}

const FILES: Record<string, (scene: Scene) => void> = {
  "gift.svg": gift,
  "id-card.svg": idCard,
  "calendar.svg": calendar,
  "wallet-phone.svg": walletPhone,
  "package.svg": package_,
  "van.svg": van,
};

function main(): void {
  const scriptDir = dirname(fileURLToPath(import.meta.url));
  const outDir = resolve(
    process.argv[2] ?? join(scriptDir, "..", "public", "images", "isometric"),
  );
  mkdirSync(outDir, { recursive: true });
  for (const [name, draw] of Object.entries(FILES)) {
    const scene = new Scene();
    draw(scene);
    writeFileSync(join(outDir, name), scene.toSvg());
    console.log(`wrote ${name}`);
  }
}

main();
