// Projection helpers and the Scene builder shared by the isometric drawings.
// Parts are painted in call order, so draw parts behind others first.
type Vec3 = [number, number, number];
type Point = { x: number; y: number };

export const NAVY_DEEP = "#0F1E33";
export const NAVY = "#1E3A5F";
export const SKY = "#8FB3D9";
export const ORANGE = "#F97316";
export const ORANGE_LIGHT = "#FDBA74";
export const KRAFT = "#E2C9A0";
export const PAPER = "#F4F4F5";
export const ZINC = "#D4D4D8";
export const GRAPHITE = "#3F3F46";
export const WHITE = "#FFFFFF";

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

export class Scene {
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
