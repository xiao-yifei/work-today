import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { PNG } from "./png-lite.mjs";

const dir = join(dirname(fileURLToPath(import.meta.url)), "../src/static");
mkdirSync(dir, { recursive: true });

function drawIcon(kind, color) {
  const size = 81;
  const png = new PNG(size, size);
  const [cr, cg, cb] = color;

  const set = (x, y, a = 255) => {
    if (x < 0 || y < 0 || x >= size || y >= size) return;
    png.set(x, y, cr, cg, cb, a);
  };

  const line = (x0, y0, x1, y1, w = 3) => {
    const dx = x1 - x0;
    const dy = y1 - y0;
    const steps = Math.max(Math.abs(dx), Math.abs(dy));
    for (let i = 0; i <= steps; i += 1) {
      const x = x0 + (dx * i) / steps;
      const y = y0 + (dy * i) / steps;
      for (let ox = -w; ox <= w; ox += 1) {
        for (let oy = -w; oy <= w; oy += 1) {
          if (ox * ox + oy * oy <= w * w)
            set(Math.round(x + ox), Math.round(y + oy));
        }
      }
    }
  };

  const circle = (cx, cy, r, fill = false) => {
    for (let y = -r; y <= r; y += 1) {
      for (let x = -r; x <= r; x += 1) {
        const d = x * x + y * y;
        if (fill ? d <= r * r : Math.abs(d - r * r) <= r * 3)
          set(cx + x, cy + y);
      }
    }
  };

  const rect = (x, y, w, h) => {
    line(x, y, x + w, y);
    line(x + w, y, x + w, y + h);
    line(x + w, y + h, x, y + h);
    line(x, y + h, x, y);
  };

  if (kind === "home") {
    line(40, 18, 64, 38);
    line(18, 38, 40, 18);
    rect(22, 38, 38, 26);
  } else if (kind === "calc") {
    rect(16, 16, 20, 20);
    rect(45, 16, 20, 20);
    rect(16, 45, 20, 20);
    rect(45, 45, 20, 20);
  } else if (kind === "cal") {
    rect(16, 22, 49, 40);
    line(16, 36, 65, 36);
    line(28, 14, 28, 28);
    line(53, 14, 53, 28);
  } else {
    circle(40, 28, 10, false);
    line(20, 62, 28, 50);
    line(28, 50, 52, 50);
    line(52, 50, 60, 62);
  }

  return png;
}

const off = [138, 132, 120];
const on = [43, 42, 38];
for (const kind of ["home", "calc", "cal", "me"]) {
  drawIcon(kind, off).write(join(dir, `tab-${kind}.png`));
  drawIcon(kind, on).write(join(dir, `tab-${kind}-on.png`));
}

console.log("tab icons written");
