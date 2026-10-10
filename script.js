"use strict";

// ==========================================
// LOVE HEART — VERSÃO CORRIGIDA
// ==========================================

const SC = 21;
const OY = 20;

const DURATION = 10;
const TICK = 16;
const ANIM = 42;
const LIFT = 34;
const GAP = 4;

const SIZES = [9, 10, 11, 12];

const FONT = "Arial";
const BG = "#060208";

const TEMPO_PARADO = 3500;

const BRILHO = 5;
const HEART_PADDING = 2;

// ==========================================
// CANVAS
// ==========================================

const canvas = document.getElementById("heart-canvas");
const ctx = canvas.getContext("2d");

const W = 800;
const H = 800;

const DPR = Math.min(window.devicePixelRatio || 1, 3);

canvas.width = W * DPR;
canvas.height = H * DPR;
canvas.style.width = `${W}px`;
canvas.style.height = `${H}px`;

ctx.setTransform(
    DPR, 0, 0, DPR,
    (W / 2) * DPR,
    (H / 2) * DPR
);

ctx.textAlign = "center";
ctx.textBaseline = "middle";

// ==========================================
// FRASES
// ==========================================

const PHRASES = [
    "I love you",
    "Seni seviyorum",
    "Te amo",
    "Je t'aime",
    "Ich liebe dich",
    "Ti amo",
    "Eu te amo",
    "Я тебя люблю",
    "사랑해",
    "愛してる",
    "我爱你",
    "मैं तुमसे प्यार करता हूँ",
    "Σ' αγαπώ",
    "Ik hou van jou",
    "Jag älskar dig",
    "Kocham cię",
    "ฉันรักเธอ",
    "Anh yêu em",
    "Aku cinta kamu",
    "Я тебе кохаю"
];

// ==========================================
// RANDOM DETERMINÍSTICO
// ==========================================

let seed = 11;

function resetSeed() {
    seed = 11;
}

function random() {
    seed = (
        Math.imul(1664525, seed) + 1013904223
    ) >>> 0;

    return seed / 4294967296;
}

function uniform(a, b) {
    return a + random() * (b - a);
}

function choice(array) {
    return array[
        Math.floor(random() * array.length)
    ];
}

function shuffle(array) {
    const result = [...array];

    for (let i = result.length - 1; i > 0; i--) {
        const j = Math.floor(random() * (i + 1));
        [result[i], result[j]] = [result[j], result[i]];
    }

    return result;
}

// ==========================================
// CORES
// ==========================================

function clamp(v) {
    return Math.max(0, Math.min(1, v));
}

function mix(a, b, k) {
    return a.map((v, i) => v + (b[i] - v) * k);
}

function dim(c, k) {
    return c.map(v => v * k);
}

function rgb(c) {
    const values = c.map(v => Math.round(clamp(v) * 255));
    return `rgb(${values.join(",")})`;
}

function hexToRGB(hex) {
    return [1, 3, 5].map(
        i => parseInt(hex.slice(i, i + 2), 16) / 255
    );
}

const BGC = hexToRGB(BG);
const FLASH = [1, 0.78, 0.78];

// ==========================================
// FORMATO MATEMÁTICO DO CORAÇÃO
// ==========================================

function heart(a) {
    const x = 16 * Math.sin(a) ** 3;

    const y =
        13 * Math.cos(a)
        - 5 * Math.cos(2 * a)
        - 2 * Math.cos(3 * a)
        - Math.cos(4 * a);

    return [x * SC, y * SC + OY];
}

const POLY = [];

for (let i = 0; i < 720; i++) {
    POLY.push(heart(2 * Math.PI * i / 720));
}

const EDGES = POLY.map((p, i) => [
    p,
    POLY[(i + 1) % POLY.length]
]);

const YMAX = Math.max(...POLY.map(p => p[1]));
const YMIN = Math.min(...POLY.map(p => p[1]));
const CY = (YMAX + YMIN) / 2;

// ==========================================
// INTERSEÇÕES DO CORAÇÃO
// ==========================================

function spans(y) {
    const xs = [];

    for (const [[x1, y1], [x2, y2]] of EDGES) {
        if ((y1 <= y && y < y2) || (y2 <= y && y < y1)) {
            xs.push(
                x1 + (y - y1) * (x2 - x1) / (y2 - y1)
            );
        }
    }

    xs.sort((a, b) => a - b);

    const result = [];

    for (let i = 0; i + 1 < xs.length; i += 2) {
        result.push([xs[i], xs[i + 1]]);
    }

    return result;
}

function intersect(A, B) {
    const out = [];

    for (const a of A) {
        for (const b of B) {
            const lo = Math.max(a[0], b[0]);
            const hi = Math.min(a[1], b[1]);

            if (hi - lo > 14) {
                out.push([lo, hi]);
            }
        }
    }

    return out;
}

// ==========================================
// FONTES E MEDIDAS
// ==========================================

function setFont(size) {
    ctx.font = `bold ${size}px ${FONT}`;
}

function getTextMetrics(text, size) {
    setFont(size);

    const tm = ctx.measureText(text);

    const width = tm.width;
    const ascent = tm.actualBoundingBoxAscent || size * 0.78;
    const descent = tm.actualBoundingBoxDescent || size * 0.28;

    return { width, ascent, descent };
}

// ==========================================
// TESTE DE ENCAIXE DENTRO DO CORAÇÃO
// ==========================================

function rectInsideHeart(cx, cy, width, ascent, descent) {
    const left = cx - width / 2;
    const right = cx + width / 2;

    const bottom = cy - descent;
    const top = cy + ascent;

    const samples = [
        bottom + 0.5,
        bottom + (top - bottom) * 0.25,
        (bottom + top) / 2,
        bottom + (top - bottom) * 0.75,
        top - 0.5
    ];

    for (const yy of samples) {
        const row = spans(yy);

        let ok = false;

        for (const [lo, hi] of row) {
            if (
                left >= lo + HEART_PADDING &&
                right <= hi - HEART_PADDING
            ) {
                ok = true;
                break;
            }
        }

        if (!ok) {
            return false;
        }
    }

    return true;
}

// ==========================================
// DISTÂNCIA AO CENTRO
// ==========================================

function mathDist(x, y) {
    return Math.hypot(
        x / (16 * SC),
        (y - CY) / (14.5 * SC)
    );
}

// ==========================================
// CONSTRUÇÃO DO CORAÇÃO
// ==========================================

function build() {
    resetSeed();

    const placed = [];

    let phraseOrder = shuffle(PHRASES);
    let phraseIndex = 0;

    function nextPhrase() {
        if (phraseIndex >= phraseOrder.length) {
            phraseOrder = shuffle(PHRASES);
            phraseIndex = 0;
        }

        return phraseOrder[phraseIndex++];
    }

    const ROW_H = 19;
    const HALF = ROW_H / 2;

    // Frases mais curtas ajudam no preenchimento
    const shortPool = [...PHRASES].sort((a, b) => a.length - b.length);

    for (let y = YMAX - HALF; y > YMIN + HALF; y -= ROW_H) {
        const row = intersect(
            spans(y + HALF - 1),
            spans(y - HALF + 1)
        );

        for (let [lo, hi] of row) {
            lo += 3;
            hi -= 3;

            let cursor = lo + uniform(0, 2.5);
            const line = [];

            let guard = 0;

            while (cursor < hi - 14 && guard < 250) {
                guard++;

                let fit = null;

                // tenta várias combinações
                for (let k = 0; k < 24; k++) {
                    const text = nextPhrase();
                    const size = choice(SIZES);
                    const m = getTextMetrics(text, size);

                    const cx = cursor + m.width / 2;

                    if (cx + m.width / 2 > hi) {
                        continue;
                    }

                    if (
                        rectInsideHeart(
                            cx, y,
                            m.width,
                            m.ascent,
                            m.descent
                        )
                    ) {
                        fit = {
                            x: cx,
                            y,
                            text,
                            size,
                            width: m.width,
                            ascent: m.ascent,
                            descent: m.descent
                        };
                        break;
                    }
                }

                // tenta frases curtas para fechar espaços
                if (!fit) {
                    for (const text of shortPool) {
                        const size = 9;
                        const m = getTextMetrics(text, size);
                        const cx = cursor + m.width / 2;

                        if (cx + m.width / 2 > hi) {
                            continue;
                        }

                        if (
                            rectInsideHeart(
                                cx, y,
                                m.width,
                                m.ascent,
                                m.descent
                            )
                        ) {
                            fit = {
                                x: cx,
                                y,
                                text,
                                size,
                                width: m.width,
                                ascent: m.ascent,
                                descent: m.descent
                            };
                            break;
                        }
                    }
                }

                if (!fit) {
                    break;
                }

                line.push(fit);
                cursor = fit.x + fit.width / 2 + GAP;
            }

            if (line.length === 0) {
                continue;
            }

            // tenta distribuir melhor a linha para reduzir buracos
            if (line.length > 1) {
                const last = line[line.length - 1];
                const usedRight = last.x + last.width / 2;
                const free = hi - usedRight;

                if (free > 5) {
                    const trial = line.map((item, i) => ({
                        ...item,
                        x: item.x + (free * i / (line.length - 1)) * 0.88
                    }));

                    const ok = trial.every(item =>
                        rectInsideHeart(
                            item.x,
                            item.y,
                            item.width,
                            item.ascent,
                            item.descent
                        )
                    );

                    if (ok) {
                        for (let i = 0; i < line.length; i++) {
                            line[i].x = trial[i].x;
                        }
                    }
                }
            } else {
                const center = (lo + hi) / 2;

                if (
                    rectInsideHeart(
                        center,
                        y,
                        line[0].width,
                        line[0].ascent,
                        line[0].descent
                    )
                ) {
                    line[0].x = center;
                }
            }

            line.forEach((item, i) => {
                placed.push({
                    x: item.x,
                    y: item.y,
                    text: item.text,
                    size: item.size,
                    width: item.width,
                    ascent: item.ascent,
                    descent: item.descent,
                    edge: i === 0 || i === line.length - 1
                });
            });
        }
    }

    // Tons vermelhos mais visíveis
    const wine = [0.76, 0.055, 0.14];
    const crimson = [1.0, 0.14, 0.23];
    const blood = [1.0, 0.24, 0.32];

    for (const p of placed) {
        const rad = Math.min(1, mathDist(p.x, p.y));

        let base = mix(
            wine,
            crimson,
            0.25 + 0.75 * rad
        );

        base = mix(
            base,
            blood,
            uniform(0, 0.18) + (p.edge ? 0.18 : 0)
        );

        p.color = base.map(clamp);
        p.rad = rad;
    }

    const edges = placed.filter(p => p.edge);
    const inner = placed.filter(p => !p.edge);

    edges.sort((a, b) => {
        const angleA = (
            Math.atan2(a.x, a.y - CY) + 2 * Math.PI
        ) % (2 * Math.PI);

        const angleB = (
            Math.atan2(b.x, b.y - CY) + 2 * Math.PI
        ) % (2 * Math.PI);

        return angleA - angleB;
    });

    for (const p of inner) {
        p.sortValue = -p.rad + uniform(0, 0.05);
    }

    inner.sort((a, b) => a.sortValue - b.sortValue);

    const result = [...edges, ...inner];

    // desvio horizontal fixo para a animação
    for (const p of result) {
        p.dx = uniform(-8, 8);
    }

    return result;
}

// ==========================================
// DESENHO
// ==========================================

function drawMainText(text, size, x, y, color, glow = true) {
    setFont(size);

    if (glow) {
        ctx.shadowColor = "rgba(255, 35, 65, 0.75)";
        ctx.shadowBlur = BRILHO;
    } else {
        ctx.shadowColor = "transparent";
        ctx.shadowBlur = 0;
    }

    ctx.fillStyle = rgb(color);
    ctx.fillText(text, x, y);

    ctx.shadowColor = "transparent";
    ctx.shadowBlur = 0;
}

function drawPhrase(p, elapsed, finishMs) {
    const u = clamp(elapsed / finishMs);
    const e = 1 - Math.pow(1 - u, 3);

    const x = p.x + p.dx * (1 - e);
    const y = -p.y - (1 - e) * LIFT;

    const flash = 0.75 * Math.sin(
        Math.PI * clamp((u - 0.55) / 0.45)
    );

    const col = mix(
        mix(BGC, p.color, e ** 1.5),
        FLASH,
        flash
    );

    // halo suave
    drawMainText(
        p.text,
        p.size + 1,
        x,
        y,
        mix(BGC, dim(p.color, 0.40), e * e),
        false
    );

    // texto principal
    drawMainText(
        p.text,
        p.size,
        x,
        y,
        col,
        true
    );
}

function drawFinished(p, color = p.color) {
    // pequeno halo
    drawMainText(
        p.text,
        p.size + 1,
        p.x,
        -p.y,
        dim(p.color, 0.45),
        false
    );

    drawMainText(
        p.text,
        p.size,
        p.x,
        -p.y,
        color,
        true
    );
}

// ==========================================
// PREPARAÇÃO
// ==========================================

const ORDER = build();

const FORMATION_MS = DURATION * 1000;
const FINISH_MS = ANIM * TICK;
const CYCLE_MS = FORMATION_MS + FINISH_MS + TEMPO_PARADO;

// ==========================================
// LOOP
// ==========================================

let cycleStart = null;

function frame(now) {
    if (cycleStart === null) {
        cycleStart = now;
    }

    let elapsed = now - cycleStart;

    if (elapsed >= CYCLE_MS) {
        cycleStart = now;
        elapsed = 0;
    }

    // Fundo
    ctx.fillStyle = BG;
    ctx.fillRect(-W / 2, -H / 2, W, H);

    const progress = clamp(elapsed / FORMATION_MS);

    const count = Math.min(
        ORDER.length,
        Math.floor(progress * ORDER.length)
    );

    const complete = elapsed >= FORMATION_MS + FINISH_MS;

    const shimmerIndex = Math.floor(elapsed / 140) % Math.max(1, ORDER.length);
    const phase = (elapsed % 140) / 140;

    for (let i = 0; i < count; i++) {
        const p = ORDER[i];
        const born = i * FORMATION_MS / ORDER.length;
        const age = elapsed - born;

        if (age >= FINISH_MS) {
            if (complete && i === shimmerIndex) {
                const brightness = 0.6 * Math.sin(Math.PI * phase);

                drawFinished(
                    p,
                    mix(p.color, FLASH, brightness)
                );
            } else {
                drawFinished(p);
            }
        } else if (age >= 0) {
            drawPhrase(p, age, FINISH_MS);
        }
    }

    requestAnimationFrame(frame);
}

requestAnimationFrame(frame);
