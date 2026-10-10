
"use strict";

// LOVE HEART — preenchimento compacto e limite real do coração
const CFG = {
  width: 800, height: 800, scale: 21, offsetY: 20,
  background: "#060208", font: "Arial, sans-serif",
  formation: 10000, settle: 672, hold: 3500,
  gap: 3, rowHeight: 16, lift: 34
};

const canvas = document.getElementById("heart-canvas");
const ctx = canvas.getContext("2d");
const dpr = Math.min(window.devicePixelRatio || 1, 3);
canvas.width = CFG.width * dpr;
canvas.height = CFG.height * dpr;

// Tamanho visual controlado pelo CSS
canvas.style.width = "100%";
canvas.style.height = "100%";

ctx.setTransform(
  dpr, 0, 0, dpr,
  CFG.width / 2 * dpr,
  CFG.height / 2 * dpr
);

ctx.textAlign = "center";
ctx.textBaseline = "alphabetic";

const phrases = [
  "I love you", "Seni seviyorum", "Te amo", "Je t'aime",
  "Ich liebe dich", "Ti amo", "Eu te amo", "Я тебя люблю",
  "사랑해", "愛してる", "我爱你", "मैं तुमसे प्यार करता हूँ",
  "Σ' αγαπώ", "Ik hou van jou", "Jag älskar dig", "Kocham cię",
  "ฉันรักเธอ", "Anh yêu em", "Aku cinta kamu", "Я тебе кохаю"
];

const shortPhrases = [
  "Te amo", "Ti amo", "사랑해", "愛してる",
  "我爱你", "Eu te amo", "I love you"
];

// ==========================================
// ALEATORIEDADE
// ==========================================

let seed = 11;

const rand = () => (
  (seed = (
    Math.imul(seed, 1664525) + 1013904223
  ) >>> 0) / 4294967296
);

const range = (a, b) => a + rand() * (b - a);
const clamp = n => Math.max(0, Math.min(1, n));

const mix = (a, b, t) =>
  a.map((x, i) => x + (b[i] - x) * t);

const cssColor = a =>
  `rgb(${a.map(x => Math.round(clamp(x) * 255)).join(",")})`;

const BG = [6 / 255, 2 / 255, 8 / 255];
const FLASH = [1, 0.78, 0.78];

// ==========================================
// FORMATO DO CORAÇÃO
// ==========================================

function heart(t) {
  const x = 16 * Math.sin(t) ** 3;

  const y =
    13 * Math.cos(t)
    - 5 * Math.cos(2 * t)
    - 2 * Math.cos(3 * t)
    - Math.cos(4 * t);

  return [
    x * CFG.scale,
    y * CFG.scale + CFG.offsetY
  ];
}

const points = Array.from(
  { length: 1440 },
  (_, i) => heart(i * Math.PI * 2 / 1440)
);

const yMax = Math.max(...points.map(p => p[1]));
const yMin = Math.min(...points.map(p => p[1]));

const centerY = (yMax + yMin) / 2;

const outline = new Path2D();

points.forEach(([x, y], i) => {
  if (i === 0) {
    outline.moveTo(x, -y);
  } else {
    outline.lineTo(x, -y);
  }
});

outline.closePath();

// ==========================================
// INTERSEÇÕES
// ==========================================

function spans(y) {
  const xs = [];

  for (let i = 0; i < points.length; i++) {
    const [ax, ay] = points[i];
    const [bx, by] = points[(i + 1) % points.length];

    if (
      (ay <= y && y < by) ||
      (by <= y && y < ay)
    ) {
      xs.push(
        ax + (y - ay) * (bx - ax) / (by - ay)
      );
    }
  }

  xs.sort((a, b) => a - b);

  const out = [];

  for (let i = 0; i + 1 < xs.length; i += 2) {
    out.push([xs[i], xs[i + 1]]);
  }

  return out;
}

function rowIntervals(y, ascent, descent, inset = 2) {
  const ys = [
    y - descent,
    y + (ascent - descent) * 0.25,
    y + (ascent - descent) * 0.5,
    y + (ascent - descent) * 0.75,
    y + ascent
  ];

  let intervals = spans(ys[0]);

  for (const yy of ys.slice(1)) {
    const next = [];

    for (const [a, b] of intervals) {
      for (const [c, d] of spans(yy)) {
        const left = Math.max(a, c);
        const right = Math.min(b, d);

        if (right - left > 0) {
          next.push([left, right]);
        }
      }
    }

    intervals = next;
  }

  return intervals
    .map(([a, b]) => [a + inset, b - inset])
    .filter(([a, b]) => b - a > 8);
}

// ==========================================
// FONTES
// ==========================================

function font(size) {
  ctx.font = `bold ${size}px ${CFG.font}`;
}

function measured(text, size) {
  font(size);

  const metrics = ctx.measureText(text);

  return {
    width: metrics.width,
    ascent: metrics.actualBoundingBoxAscent || size * 0.9,
    descent: metrics.actualBoundingBoxDescent || size * 0.3
  };
}

function shuffle(a) {
  a = [...a];

  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));

    [a[i], a[j]] = [a[j], a[i]];
  }

  return a;
}

// ==========================================
// CONSTRUÇÃO DO CORAÇÃO
// ==========================================

function build() {
  const items = [];

  const palette = [
    [0.76, 0.055, 0.14],
    [1, 0.14, 0.23],
    [1, 0.24, 0.32]
  ];

  for (
    let y = yMax - 7;
    y > yMin + 7;
    y -= CFG.rowHeight
  ) {
    const bands = rowIntervals(y, 11, 3);

    for (const [start, end] of bands) {
      let x = start;
      const line = [];

      while (end - x > 17) {
        const budget = end - x;
        const proposals = [];

        const pool = shuffle([
          ...phrases,
          ...shortPhrases,
          ...shortPhrases
        ]);

        for (const text of pool) {
          for (const size of [11, 10, 9]) {
            const met = measured(text, size);

            if (met.width > budget) {
              continue;
            }

            const safe = rowIntervals(
              y,
              met.ascent,
              met.descent
            );

            const ok = safe.some(
              ([a, b]) =>
                x >= a - 0.001 &&
                x + met.width <= b + 0.001
            );

            if (ok) {
              proposals.push({
                text,
                size,
                ...met
              });
            }
          }
        }

        if (!proposals.length) {
          x += 2;

          if (x >= end - 17) {
            break;
          }

          continue;
        }

        proposals.sort((a, b) => a.width - b.width);

        let selected;

        if (budget < 95) {
          selected = proposals[proposals.length - 1];
        } else {
          selected = proposals[
            Math.floor(
              rand() * Math.min(proposals.length, 12)
            )
          ];
        }

        line.push({
          x: x + selected.width / 2,
          y,
          text: selected.text,
          size: selected.size,
          width: selected.width,
          ascent: selected.ascent,
          descent: selected.descent
        });

        x += selected.width + CFG.gap;
      }

      // Distribuição sem ultrapassar o limite
      if (line.length > 1) {
        const last = line[line.length - 1];

        const slack = Math.max(
          0,
          end - (last.x + last.width / 2)
        );

        const shift = slack / (line.length - 1);

        if (shift <= 12) {
          line.forEach((p, i) => {
            p.x += shift * i;
          });
        }
      }

      line.forEach((p, i) => {
        const edge = (
          i === 0 ||
          i === line.length - 1
        );

        const rad = Math.min(
          1,
          Math.hypot(
            p.x / (16 * CFG.scale),
            (p.y - centerY) / (14.5 * CFG.scale)
          )
        );

        let color = mix(
          palette[0],
          palette[1],
          0.25 + 0.75 * rad
        );

        color = mix(
          color,
          palette[2],
          range(0, 0.18) + (edge ? 0.18 : 0)
        ).map(clamp);

        items.push({
          ...p,
          edge,
          rad,
          color,
          dx: range(-10, 10)
        });
      });
    }
  }

  const border = items.filter(p => p.edge);
  const inside = items.filter(p => !p.edge);

  // Contorno primeiro
  border.sort((a, b) => {
    const angleA = (
      Math.atan2(a.x, a.y - centerY) +
      2 * Math.PI
    ) % (2 * Math.PI);

    const angleB = (
      Math.atan2(b.x, b.y - centerY) +
      2 * Math.PI
    ) % (2 * Math.PI);

    return angleA - angleB;
  });

  // Preenchimento de fora para dentro
  inside.forEach(p => {
    p.order = -p.rad + range(0, 0.05);
  });

  inside.sort((a, b) => a.order - b.order);

  return [...border, ...inside];
}

// ==========================================
// ELEMENTOS DA ANIMAÇÃO
// ==========================================

const ORDER = build();

const total = (
  CFG.formation +
  CFG.settle +
  CFG.hold
);

function text(p, x, y, color, glow) {
  font(p.size);

  ctx.fillStyle = cssColor(color);

  ctx.shadowColor = glow
    ? "rgba(255,40,72,.65)"
    : "transparent";

  ctx.shadowBlur = glow ? 3 : 0;

  ctx.fillText(p.text, x, y);

  ctx.shadowBlur = 0;
}

// ==========================================
// MOVIMENTO DAS FRASES
// ==========================================

function draw(p, age, highlight = false) {
  if (age >= CFG.settle) {
    text(
      p,
      p.x,
      -p.y,
      highlight
        ? mix(p.color, FLASH, 0.55)
        : p.color,
      true
    );

    return;
  }

  const u = clamp(age / CFG.settle);
  const e = 1 - (1 - u) ** 3;

  const x = p.x + p.dx * (1 - e);
  const y = -p.y - CFG.lift * (1 - e);

  const flash = 0.75 * Math.sin(
    Math.PI * clamp((u - 0.55) / 0.45)
  );

  const col = mix(
    mix(BG, p.color, e ** 1.5),
    FLASH,
    flash
  );

  text(p, x, y, col, true);
}

// ==========================================
// REPETIÇÃO INFINITA
// ==========================================

let started = null;

function frame(now) {
  if (started === null) {
    started = now;
  }

  const elapsed = (now - started) % total;

  // Limpa o fundo
  ctx.fillStyle = CFG.background;
  ctx.fillRect(-400, -400, 800, 800);

  // Limita o desenho ao formato real
  // do coração, sem letras escapando.
  ctx.save();
  ctx.clip(outline);

  const count = Math.min(
    ORDER.length,
    Math.floor(
      Math.min(1, elapsed / CFG.formation) *
      ORDER.length
    )
  );

  const complete = (
    elapsed >= CFG.formation + CFG.settle
  );

  const highlighted = (
    Math.floor(elapsed / 140) %
    Math.max(1, ORDER.length)
  );

  for (let i = 0; i < count; i++) {
    const age = (
      elapsed -
      i * CFG.formation / ORDER.length
    );

    draw(
      ORDER[i],
      age,
      complete && i === highlighted
    );
  }

  ctx.restore();

  requestAnimationFrame(frame);
}

// ==========================================
// INICIAR
// ==========================================

requestAnimationFrame(frame);
