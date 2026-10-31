// Generates the flat isometric SVG illustrations in public/images/isometric.
// Run with `bun scripts/generate-isometric.ts [outputDir]`. Drawings are built
// from axis-aligned boxes and vertical cylinders, projected at 30 degrees.
// Parts are painted in call order, so draw parts behind others first.

import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import {
  GRAPHITE,
  KRAFT,
  NAVY,
  ORANGE,
  ORANGE_LIGHT,
  PAPER,
  Scene,
  SKY,
  WHITE,
  ZINC,
} from "./isometric/scene";

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

// Checkout empty cart: a basket holding a battery and an oil bottle.
function basket(s: Scene): void {
  s.shadowBox([-1, -1, 0], [34, 26]);
  s.box([0, 0, 0], [32, 24, 8], NAVY);
  s.box([0, 24, 3], [32, 0.5, 2], ORANGE);
  s.box([-1, -1, 8], [34, 26, 1.2], SKY);
  s.box([3, 3, 9.2], [14, 11, 13], GRAPHITE);
  s.box([5, 5, 22.2], [3, 3, 2], ORANGE);
  s.box([12, 5, 22.2], [3, 3, 2], SKY);
  s.cylinder([24, 17, 9.2], 4.5, 15, ORANGE);
  s.cylinder([24, 17, 24.2], 2, 4, NAVY);
}

// Checkout payment: a bank card with a stack of coins beside it.
function paymentCard(s: Scene): void {
  s.shadowBox([1, 1, 0], [36, 22]);
  s.shadowDisc([46, 10, 0], 7);
  s.box([0, 0, 0], [36, 22, 2], NAVY);
  s.box([0, 4, 2], [36, 4, 0.6], GRAPHITE);
  s.box([4, 12, 2], [8, 6, 0.8], ORANGE_LIGHT);
  s.box([16, 14, 2], [16, 2, 0.8], SKY);
  s.box([16, 18, 2], [10, 2, 0.8], SKY);
  s.cylinder([46, 10, 0], 6, 2, ORANGE_LIGHT);
  s.cylinder([46, 10, 2], 6, 2, ORANGE);
  s.cylinder([46, 10, 4], 6, 2, ORANGE_LIGHT);
}

// Booking confirmation: a clipboard with a ticked checklist.
function clipboard(s: Scene): void {
  s.shadowBox([-1, 3, 0], [24, 7]);
  s.box([0, 4, 0], [22, 3, 30], NAVY);
  s.box([2, 7, 2.5], [18, 0.4, 25], PAPER);
  s.box([5, 7.4, 20], [4, 0.4, 3], ORANGE);
  s.box([11, 7.4, 20.5], [7, 0.4, 2], ZINC);
  s.box([5, 7.4, 13], [4, 0.4, 3], ORANGE);
  s.box([11, 7.4, 13.5], [7, 0.4, 2], ZINC);
  s.box([5, 7.4, 6], [4, 0.4, 3], ZINC);
  s.box([11, 7.4, 6.5], [5, 0.4, 2], ZINC);
  s.box([7, 7, 28], [8, 1, 4], GRAPHITE);
}

// Rescue: a flatbed tow truck carrying a stranded car.
function towTruck(s: Scene): void {
  s.shadowBox([-1, -2, 0], [48, 21]);
  s.cylinder([7, -1, 0], 4.5, 4, GRAPHITE);
  s.cylinder([34, -1, 0], 4.5, 4, GRAPHITE);
  s.box([0, 0, 4], [30, 16, 2], NAVY);
  s.box([30, 0, 4], [12, 16, 12], ORANGE);
  s.box([42, 3, 9], [0.5, 10, 4], SKY);
  s.box([34, 5, 16], [4, 6, 1.5], ORANGE_LIGHT);
  s.box([3, 2, 6], [24, 12, 6], SKY);
  s.box([8, 3, 12], [13, 10, 5], PAPER);
  s.box([0, 16, 4.5], [30, 0.5, 1], ORANGE);
  s.box([34, 16, 9], [6, 0.5, 4], SKY);
  s.cylinder([7, 17, 0], 4.5, 4, GRAPHITE);
  s.cylinder([34, 17, 0], 4.5, 4, GRAPHITE);
}

// Staff income: two stacks of coins.
function coins(s: Scene): void {
  s.shadowDisc([1, 1, 0], 8);
  s.shadowDisc([16, 14, 0], 8);
  for (let i = 0; i < 4; i++) {
    s.cylinder([0, 0, i * 2], 7, 2, i % 2 === 0 ? ORANGE_LIGHT : ORANGE);
  }
  s.disc([0, 0, 8.05], 3.5, NAVY);
  for (let i = 0; i < 3; i++) {
    s.cylinder([15, 13, i * 2], 7, 2, i % 2 === 0 ? ORANGE_LIGHT : ORANGE);
  }
  s.disc([15, 13, 6.05], 3.5, NAVY);
}

// Staff stock: stacked storage crates with labels.
function crates(s: Scene): void {
  s.shadowBox([-1, -1, 0], [34, 26]);
  s.box([0, 0, 0], [16, 24, 10], KRAFT);
  s.box([16, 0, 0], [16, 24, 10], KRAFT);
  s.box([2, 24, 3], [12, 0.4, 4], PAPER);
  s.box([18, 24, 3], [12, 0.4, 4], ORANGE);
  s.box([6, 3, 10], [20, 18, 9], KRAFT);
  s.box([9, 21, 13], [14, 0.4, 4], PAPER);
}

const FILES: Record<string, (scene: Scene) => void> = {
  "coins.svg": coins,
  "crates.svg": crates,
  "clipboard.svg": clipboard,
  "tow-truck.svg": towTruck,
  "basket.svg": basket,
  "payment-card.svg": paymentCard,
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
