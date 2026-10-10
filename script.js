
"use strict";

// LOVE HEART — PREENCHIMENTO CORRIGIDO

const SC = 21;
const OY = 20;

const DURATION = 10;
const TICK = 16;
const ANIM = 42;
const LIFT = 34;
const GAP = 7;

const SIZES = [10, 11, 12, 13];

const FONT = "Arial";
const BG = "#060208";

const TEMPO_PARADO = 3500;
const BRILHO = 5;
const INTENSIDADE_BRILHO = 0.38;

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

canvas.style.width = "100%";
canvas.style.height = "100%";

ctx.setTransform(
    DPR, 0, 0, DPR,
    W * DPR / 2,
    H * DPR / 2
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

const EXTRA_PHRASES = [
    "Te quiero",
    "Te iubesc",
    "Volim te",
    "Miluji tě",
    "Mahal kita",
    "Szeretlek",
    "Aishiteru",
    "Nakupenda",
    "T'estimo",
    "Jeg elsker deg",
    "Te sakam",
    "Amo-te",
    "사랑해",
    "愛してる",
    "我爱你",
    "Eu te amo",
    "Ti amo",
    "I love you",
    "Je t'aime",
    "Te amo"
];

const VARIANTS = [
    ...new Set([...PHRASES, ...EXTRA_PHRASES])
];

// ==========================================
// ALEATORIEDADE
// ==========================================

let seed = 11;

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
    return array[Math.floor(random() * array.length)];
}

function shuffle(array) {
    const copy = [...array];

    for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(random() * (i + 1));

        [copy[i], copy[j]] = [copy[j], copy[i]];
    }

    return copy;
}

// ==========================================
// CORES
// ==========================================

const clamp = v => Math.max(0, Math.min(1, v));

const mix = (a, b, k) =>
    a.map((v, i) => v + (b[i] - v) * k);

const dim = (c, k) =>
    c.map(v => v * k);

const rgb = c =>
    `rgb(${c.map(
        v => Math.round(clamp(v) * 255)
    ).join(",")})`;

const BGC = [6 / 255, 2 / 255, 8 / 255];
const FLASH = [1, 0.78, 0.78];

// ==========================================
// CORAÇÃO MATEMÁTICO
// ==========================================

function heart(a) {
    return [
        16 * Math.sin(a) ** 3 * SC,

        (
            13 * Math.cos(a)
            - 5 * Math.cos(2 * a)
            - 2 * Math.cos(3 * a)
            - Math.cos(4 * a)
        ) * SC + OY
    ];
}

const POLY = Array.from(
    { length: 720 },
    (_, i) => heart(i * 2 * Math.PI / 720)
);

const EDGES = POLY.map(
    (p, i) => [p, POLY[(i + 1) % POLY.length]]
);

const YMAX = Math.max(...POLY.map(p => p[1]));
const YMIN = Math.min(...POLY.map(p => p[1]));
const CY = (YMAX + YMIN) / 2;

// Máscara: nada ultrapassa o coração

const HEART_MASK = new Path2D();

POLY.forEach(([x, y], i) => {
    if (i === 0) {
        HEART_MASK.moveTo(x, -y);
    } else {
        HEART_MASK.lineTo(x, -y);
    }
});

HEART_MASK.closePath();

// ==========================================
// INTERSEÇÕES
// ==========================================

function spans(y) {
    const xs = [];

    for (const [[x1, y1], [x2, y2]] of EDGES) {
        if (
            (y1 <= y && y < y2) ||
            (y2 <= y && y < y1)
        ) {
            xs.push(
                x1 + (y - y1) *
                (x2 - x1) / (y2 - y1)
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
// FONTES
// ==========================================

function setFont(size) {
    ctx.font = `bold ${size}px ${FONT}`;
}

function measureText(text, size) {
    setFont(size);
    return ctx.measureText(text).width;
}

const ROW_H = 23;
const HALF = ROW_H / 2;

function mathDist(x, y) {
    return Math.hypot(
        x / (16 * SC),
        (y - CY) / (14.5 * SC)
    );
}

// ==========================================
// CORES DAS PALAVRAS
// ==========================================

function colorize(p, edge) {
    const wine = [0.76, 0.055, 0.14];
    const crimson = [1, 0.14, 0.23];
    const blood = [1, 0.24, 0.32];

    const rad = Math.min(
        1,
        mathDist(p.x, p.y)
    );

    let c = mix(
        wine,
        crimson,
        0.25 + 0.75 * rad
    );

    c = mix(
        c,
        blood,
        uniform(0, 0.22) + (edge ? 0.22 : 0)
    );

    p.color = c.map(clamp);
    p.rad = rad;
    p.edge = edge;
    p.dx = uniform(-10, 10);

    return p;
}

// ==========================================
// FORMAÇÃO ORIGINAL
// ==========================================

function buildBase() {
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

    for (
        let y = YMAX - HALF;
        y > YMIN + HALF;
        y -= ROW_H
    ) {
        const row = intersect(
            spans(y + HALF),
            spans(y - HALF)
        );

        for (let [lo, hi] of row) {
            lo += 4;
            hi -= 4;

            let cur = lo + uniform(0, 8);
            const line = [];

            while (true) {
                let fit = null;

                for (let k = 0; k < 10; k++) {
                    const text = nextPhrase();
                    const size = choice(SIZES);
                    const w = measureText(text, size);

                    if (cur + w <= hi) {
                        fit = { text, size, w };
                        break;
                    }
                }

                if (!fit) break;

                line.push({
                    x: cur + fit.w / 2,
                    y,
                    ...fit
                });

                cur += fit.w + GAP;
            }

            if (!line.length) continue;

            if (line.length > 1) {
                const last = line[line.length - 1];

                const slack = hi - (
                    last.x + last.w / 2
                );

                line.forEach((p, i) => {
                    p.x += slack * i / (line.length - 1);
                });
            } else {
                line[0].x = (lo + hi) / 2;
            }

            line.forEach((p, i) => {
                placed.push(
                    colorize(
                        p,
                        i === 0 || i === line.length - 1
                    )
                );
            });
        }
    }

    return placed;
}

// ==========================================
// DETECÇÃO DE SOBREPOSIÇÃO
// ==========================================

function box(p, pad = 1.5) {
    const h = p.size * 1.14;

    return {
        left: p.x - p.w / 2 - pad,
        right: p.x + p.w / 2 + pad,
        bottom: p.y - h / 2 - pad,
        top: p.y + h / 2 + pad
    };
}

function overlaps(a, b) {
    return (
        a.left < b.right &&
        a.right > b.left &&
        a.bottom < b.top &&
        a.top > b.bottom
    );
}

function canFit(p, existing) {
    const b = box(p, 1.4);

    for (const q of existing) {
        if (
            Math.abs(q.y - p.y) > 20 ||
            Math.abs(q.x - p.x) > 160
        ) continue;

        if (overlaps(b, box(q, 1.4))) {
            return false;
        }
    }

    const inset = 2;

    const ys = [
        p.y - p.size * 0.48,
        p.y,
        p.y + p.size * 0.48
    ];

    return ys.every(y =>
        spans(y).some(([lo, hi]) =>
            p.x - p.w / 2 >= lo + inset &&
            p.x + p.w / 2 <= hi - inset
        )
    );
}

// ==========================================
// DISTRIBUIÇÃO DOS IDIOMAS
// ==========================================

function diversify(base) {
    const ordered = [...base].sort(
        (a, b) => b.y - a.y || a.x - b.x
    );

    const done = [];

    for (const p of ordered) {
        const near = done.filter(q =>
            Math.abs(q.x - p.x) < 88 &&
            Math.abs(q.y - p.y) < 55
        );

        if (near.some(q => q.text === p.text)) {
            const options = VARIANTS.map(text => ({
                text,
                w: measureText(text, p.size)
            }))
            .filter(q =>
                !near.some(n => n.text === q.text) &&
                Math.abs(q.w - p.w) < 4
            )
            .sort((a, b) =>
                Math.abs(a.w - p.w) -
                Math.abs(b.w - p.w)
            );

            if (options.length) {
                p.text = options[0].text;
                p.w = options[0].w;
            }
        }

        done.push(p);
    }
}

// ==========================================
// PREENCHIMENTO DOS ESPAÇOS
// ==========================================

function fillGaps(base) {
    const added = [];
    const all = [...base];

    const useCount = new Map();

    for (const p of base) {
        useCount.set(
            p.text,
            (useCount.get(p.text) || 0) + 1
        );
    }

    // Primeiro percorre as linhas originais.
    // Depois verifica espaços entre as linhas.

    const rows = [];

    for (
        let y = YMAX - HALF;
        y > YMIN + HALF;
        y -= ROW_H
    ) {
        rows.push(y);
    }

    for (
        let y = YMAX - HALF - ROW_H / 2;
        y > YMIN + HALF;
        y -= ROW_H
    ) {
        rows.push(y);
    }

    for (const y of rows) {
        const safe = intersect(
            spans(y + 6.5),
            spans(y - 6.5)
        );

        for (let [lo, hi] of safe) {
            lo += 2;
            hi -= 2;

            if (hi - lo < 18) continue;

            const blocked = [];

            for (const q of all) {
                const b = box(q, 1.5);

                if (
                    b.top < y - 6.6 ||
                    b.bottom > y + 6.6
                ) continue;

                blocked.push([b.left, b.right]);
            }

            blocked.sort((a, b) => a[0] - b[0]);

            const merged = [];

            for (const interval of blocked) {
                const last = merged[merged.length - 1];

                if (
                    last &&
                    interval[0] <= last[1]
                ) {
                    last[1] = Math.max(
                        last[1],
                        interval[1]
                    );
                } else {
                    merged.push([...interval]);
                }
            }

            const gaps = [];
            let cursor = lo;

            for (const [a, b] of merged) {
                if (a > cursor + 13) {
                    gaps.push([
                        cursor,
                        Math.min(a, hi)
                    ]);
                }

                cursor = Math.max(cursor, b);

                if (cursor >= hi) break;
            }

            if (hi > cursor + 13) {
                gaps.push([cursor, hi]);
            }

            // Preenche somente áreas livres
            for (const [glo, ghi] of gaps) {
                const gw = ghi - glo;

                let selected = null;

                const nearby = all.filter(q =>
                    Math.abs(q.y - y) < 48 &&
                    Math.abs(
                        q.x - (glo + ghi) / 2
                    ) < 110
                );

                const candidates = [];

                // Prioridade: frases completas
                for (const text of VARIANTS) {
                    if (
                        nearby.some(
                            p => p.text === text
                        )
                    ) continue;

                    for (const size of [12, 11, 10, 9]) {
                        const w = measureText(
                            text,
                            size
                        );

                        if (w > gw - 3) continue;

                        const p = {
                            x: (glo + ghi) / 2,
                            y,
                            text,
                            size,
                            w
                        };

                        if (!canFit(p, all)) continue;

                        const target = Math.min(gw - 3, 80);

                        const score =
                            Math.abs(target - w) * 0.28 +
                            (12 - size) * 1.3 +
                            (useCount.get(text) || 0) * 1.7;

                        candidates.push({
                            p,
                            score
                        });
                    }
                }

                candidates.sort(
                    (a, b) => a.score - b.score
                );

                if (candidates.length) {
                    selected = candidates[0].p;
                } else {
                    // Nos menores espaços, utiliza
                    // pequenos trechos de frases.
                    const truncations = [
                        "Eu te",
                        "I love",
                        "Te am",
                        "Je t'",
                        "Ti am",
                        "사랑",
                        "我爱",
                        "愛して",
                        "Te qu",
                        "Volim",
                        "Miluji"
                    ];

                    for (const text of shuffle(truncations)) {
                        for (const size of [11, 10, 9]) {
                            const w = measureText(
                                text,
                                size
                            );

                            if (w > gw - 3) continue;

                            const p = {
                                x: (glo + ghi) / 2,
                                y,
                                text,
                                size,
                                w
                            };

                            if (canFit(p, all)) {
                                selected = p;
                                break;
                            }
                        }

                        if (selected) break;
                    }
                }

                if (selected) {
                    colorize(selected, false);

                    all.push(selected);
                    added.push(selected);

                    useCount.set(
                        selected.text,
                        (useCount.get(selected.text) || 0) + 1
                    );
                }
            }
        }
    }

    return added;
}

// ==========================================
// ORDEM DA ANIMAÇÃO
// ==========================================

function build() {
    const base = buildBase();

    diversify(base);

    const fills = fillGaps(base);

    const full = [...base, ...fills];

    const edges = full.filter(p => p.edge);
    const inner = full.filter(p => !p.edge);

    // Contorno primeiro
    edges.sort((a, b) => {
        const angleA = (
            Math.atan2(a.x, a.y - CY) +
            2 * Math.PI
        ) % (2 * Math.PI);

        const angleB = (
            Math.atan2(b.x, b.y - CY) +
            2 * Math.PI
        ) % (2 * Math.PI);

        return angleA - angleB;
    });

    // Interior depois
    for (const p of inner) {
        p.sortValue =
            -p.rad + uniform(0, 0.08);
    }

    inner.sort(
        (a, b) => a.sortValue - b.sortValue
    );

    return [...edges, ...inner];
}

// ==========================================
// TEMPOS
// ==========================================

const ORDER = build();

const FORMATION_MS = DURATION * 1000;
const FINISH_MS = ANIM * TICK;

const CYCLE_MS =
    FORMATION_MS +
    FINISH_MS +
    TEMPO_PARADO;

// ==========================================
// TEXTO
// ==========================================

function drawText(
    text,
    size,
    x,
    y,
    color,
    glow = true
) {
    setFont(size);

    ctx.fillStyle = rgb(color);

    ctx.shadowColor = glow
        ? "rgba(255, 35, 65, 0.75)"
        : "transparent";

    ctx.shadowBlur = glow ? BRILHO : 0;

    ctx.fillText(text, x, y);

    ctx.shadowBlur = 0;
    ctx.shadowColor = "transparent";
}

// ==========================================
// FRASE SURGINDO
// ==========================================

function drawPhrase(p, age) {
    const u = clamp(age / FINISH_MS);
    const e = 1 - (1 - u) ** 3;

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

    drawText(
        p.text,
        p.size + 1,
        x,
        y,
        mix(
            BGC,
            dim(p.color, 0.4),
            e * e
        ),
        false
    );

    drawText(
        p.text,
        p.size,
        x,
        y,
        col,
        true
    );
}

// ==========================================
// FRASE COMPLETA
// ==========================================

function drawFinished(p, color = p.color) {
    ctx.save();

    ctx.shadowColor = "rgba(255, 35, 65, 0.6)";

    ctx.shadowBlur =
        BRILHO * INTENSIDADE_BRILHO;

    setFont(p.size);

    ctx.fillStyle = rgb(color);

    ctx.fillText(p.text, p.x, -p.y);

    ctx.restore();
}

// ==========================================
// LOOP INFINITO
// ==========================================

let cycleStart = null;

function frame(now) {
    if (cycleStart === null) {
        cycleStart = now;
    }

    const elapsed =
        (now - cycleStart) % CYCLE_MS;

    ctx.fillStyle = BG;

    ctx.fillRect(
        -W / 2,
        -H / 2,
        W,
        H
    );

    ctx.save();

    // Nenhuma palavra ultrapassa
    // o formato do coração.
    ctx.clip(HEART_MASK);

    const count = Math.min(
        ORDER.length,
        Math.floor(
            clamp(elapsed / FORMATION_MS) *
            ORDER.length
        )
    );

    const complete =
        elapsed >= FORMATION_MS + FINISH_MS;

    const shimmerIndex =
        Math.floor(elapsed / 140) %
        Math.max(1, ORDER.length);

    const phase =
        (elapsed % 140) / 140;

    for (let i = 0; i < count; i++) {
        const p = ORDER[i];

        const born =
            i * FORMATION_MS / ORDER.length;

        const age = elapsed - born;

        if (age >= FINISH_MS) {
            if (
                complete &&
                i === shimmerIndex
            ) {
                const brightness =
                    0.6 * Math.sin(Math.PI * phase);

                drawFinished(
                    p,
                    mix(
                        p.color,
                        FLASH,
                        brightness
                    )
                );
            } else {
                drawFinished(p);
            }
        } else if (age >= 0) {
            drawPhrase(p, age);
        }
    }

    ctx.restore();

    requestAnimationFrame(frame);
}

requestAnimationFrame(frame);
