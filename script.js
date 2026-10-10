
"use strict";

// ==========================================
// LOVE HEART — PREENCHIMENTO ATUALIZADO
// ==========================================

// CONFIGURAÇÕES ORIGINAIS

const SC = 21;
const OY = 20;

const DURATION = 10;
const TICK = 16;
const ANIM = 42;
const LIFT = 34;

const GAP = 5;
const ROW_H = 21;
const HALF = ROW_H / 2;

const SIZES = [10, 11, 12, 13];

const FONT = "Arial";
const BG = "#060208";

const TEMPO_PARADO = 3500;

const BRILHO = 5;
const INTENSIDADE_BRILHO = 0.38;

// ==========================================
// CANVAS
// ==========================================

const canvas = document.getElementById(
    "heart-canvas"
);

const ctx = canvas.getContext("2d");

const W = 800;
const H = 800;

const DPR = Math.min(
    window.devicePixelRatio || 1,
    3
);

canvas.width = W * DPR;
canvas.height = H * DPR;

canvas.style.width = "100%";
canvas.style.height = "100%";

ctx.setTransform(
    DPR, 0, 0, DPR,
    (W / 2) * DPR,
    (H / 2) * DPR
);

ctx.textAlign = "center";
ctx.textBaseline = "middle";

// ==========================================
// FRASES ORIGINAIS
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
// MAIS IDIOMAS PARA DIVERSIFICAR
// ==========================================

const EXTRAS = [
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
    "Minä rakastan sinua",
    "Te sakam",
    "Ma armastan sind",
    "Ég elska þig",
    "Amo-te",
    "Eu te amo",
    "I love you",
    "Ti amo",
    "Je t'aime",
    "사랑해",
    "愛してる",
    "我爱你"
];

const ALL_PHRASES = [
    ...new Set([...PHRASES, ...EXTRAS])
];

// ==========================================
// ALEATORIEDADE FIXA
// ==========================================

let seed = 11;

function random() {
    seed = (
        Math.imul(1664525, seed)
        + 1013904223
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

        [result[i], result[j]] = [
            result[j],
            result[i]
        ];
    }

    return result;
}

// ==========================================
// CORES ORIGINAIS
// ==========================================

function clamp(v) {
    return Math.max(0, Math.min(1, v));
}

function mix(a, b, k) {
    return a.map(
        (v, i) => v + (b[i] - v) * k
    );
}

function dim(c, k) {
    return c.map(v => v * k);
}

function rgb(c) {
    const values = c.map(
        v => Math.round(clamp(v) * 255)
    );

    return `rgb(${values.join(",")})`;
}

const BGC = [
    6 / 255,
    2 / 255,
    8 / 255
];

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

    return [
        x * SC,
        y * SC + OY
    ];
}

const POLY = Array.from(
    { length: 720 },
    (_, i) => heart(i * Math.PI * 2 / 720)
);

const EDGES = POLY.map(
    (p, i) => [
        p,
        POLY[(i + 1) % POLY.length]
    ]
);

const YMAX = Math.max(
    ...POLY.map(p => p[1])
);

const YMIN = Math.min(
    ...POLY.map(p => p[1])
);

const CY = (YMAX + YMIN) / 2;

// ==========================================
// MÁSCARA DE PROTEÇÃO
// ==========================================

const HEART_MASK = new Path2D();

POLY.forEach((p, i) => {
    const x = p[0];
    const y = -p[1];

    if (i === 0) {
        HEART_MASK.moveTo(x, y);
    } else {
        HEART_MASK.lineTo(x, y);
    }
});

HEART_MASK.closePath();

// ==========================================
// INTERSEÇÕES DO CORAÇÃO
// ==========================================

function spans(y) {
    const xs = [];

    for (const [[x1, y1], [x2, y2]] of EDGES) {
        if (
            (y1 <= y && y < y2) ||
            (y2 <= y && y < y1)
        ) {
            xs.push(
                x1 + (y - y1)
                * (x2 - x1) / (y2 - y1)
            );
        }
    }

    xs.sort((a, b) => a - b);

    const result = [];

    for (let i = 0; i + 1 < xs.length; i += 2) {
        result.push([
            xs[i],
            xs[i + 1]
        ]);
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
// COR E MOVIMENTO
// ==========================================

function colorize(p, edge) {
    const wine = [0.76, 0.055, 0.14];
    const crimson = [1.0, 0.14, 0.23];
    const blood = [1.0, 0.24, 0.32];

    const rad = Math.min(
        1,
        mathDist(p.x, p.y)
    );

    let color = mix(
        wine,
        crimson,
        0.25 + 0.75 * rad
    );

    color = mix(
        color,
        blood,
        uniform(0, 0.22) + (edge ? 0.22 : 0)
    );

    p.color = color.map(clamp);
    p.rad = rad;
    p.edge = edge;
    p.dx = uniform(-10, 10);

    return p;
}

// ==========================================
// CONSTRUÇÃO ORIGINAL DO CORAÇÃO
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

                if (!fit) {
                    break;
                }

                line.push({
                    x: cur + fit.w / 2,
                    y,
                    ...fit
                });

                cur += fit.w + GAP;
            }

            if (!line.length) {
                continue;
            }

            if (line.length > 1) {
                const last = line[line.length - 1];

                const free = hi - (
                    last.x + last.w / 2
                );

                line.forEach((p, i) => {
                    p.x += (
                        free * i / (line.length - 1)
                    );
                });
            } else {
                line[0].x = (lo + hi) / 2;
            }

            line.forEach((p, i) => {
                placed.push(
                    colorize(
                        p,
                        i === 0 ||
                        i === line.length - 1
                    )
                );
            });
        }
    }

    return placed;
}

// ==========================================
// LIMITES DAS PALAVRAS
// ==========================================

function itemBounds(p, pad = 2) {
    return {
        left: p.x - p.w / 2 - pad,
        right: p.x + p.w / 2 + pad,
        bottom: p.y - p.size * 0.57 - pad,
        top: p.y + p.size * 0.57 + pad
    };
}

function boxesOverlap(a, b) {
    return (
        a.left < b.right &&
        a.right > b.left &&
        a.bottom < b.top &&
        a.top > b.bottom
    );
}

function fitsHeart(x, y, w, size) {
    const samples = [
        y - size * 0.48,
        y,
        y + size * 0.48
    ];

    for (const yy of samples) {
        const fits = spans(yy).some(
            ([a, b]) =>
                x - w / 2 >= a + 1 &&
                x + w / 2 <= b - 1
        );

        if (!fits) {
            return false;
        }
    }

    return true;
}

function canPlace(p, placed, pad = 2) {
    if (!fitsHeart(p.x, p.y, p.w, p.size)) {
        return false;
    }

    const bounds = itemBounds(p, pad);

    return !placed.some(
        q => boxesOverlap(
            bounds,
            itemBounds(q, pad)
        )
    );
}

// ==========================================
// AGRUPAMENTO DOS ESPAÇOS OCUPADOS
// ==========================================

function joinIntervals(intervals) {
    intervals.sort((a, b) => a[0] - b[0]);

    const out = [];

    for (const [lo, hi] of intervals) {
        if (
            out.length &&
            lo <= out[out.length - 1][1]
        ) {
            out[out.length - 1][1] = Math.max(
                hi,
                out[out.length - 1][1]
            );
        } else {
            out.push([lo, hi]);
        }
    }

    return out;
}

// ==========================================
// FRASES CURTAS PARA OS ESPAÇOS
// ==========================================

const FILLER_PHRASES = [
    "Te amo",
    "Eu te amo",
    "I love you",
    "Love you",
    "Ti amo",
    "Je t'aime",
    "Te quiero",
    "Amo você",
    "Ich liebe dich",
    "Te iubesc",
    "Volim te",
    "Miluji tě",
    "Mahal kita",
    "Aishiteru",
    "사랑해",
    "愛してる",
    "我爱你",
    "Kocham cię",
    "Ik hou van jou",
    "Jag älskar dig"
];

// ==========================================
// PREENCHIMENTO ORIGINAL
// ==========================================

function originalFillVoids(placed) {
    let fillerOrder = shuffle(FILLER_PHRASES);
    let fillerIndex = 0;

    function nextPool() {
        if (fillerIndex >= fillerOrder.length - 1) {
            fillerOrder = shuffle(FILLER_PHRASES);
            fillerIndex = 0;
        }

        const rotated = [
            ...fillerOrder.slice(fillerIndex),
            ...fillerOrder.slice(0, fillerIndex)
        ];

        fillerIndex++;

        return rotated;
    }

    for (
        let y = YMAX - HALF;
        y > YMIN + HALF;
        y -= ROW_H / 2
    ) {
        const segments = intersect(
            spans(y + HALF * 0.9),
            spans(y - HALF * 0.9)
        );

        for (const [segLo, segHi] of segments) {
            const occupied = [];

            for (const p of placed) {
                const bounds = itemBounds(p);

                if (
                    bounds.top > y - HALF * 0.55 &&
                    bounds.bottom < y + HALF * 0.55
                ) {
                    occupied.push([
                        bounds.left,
                        bounds.right
                    ]);
                }
            }

            const merged = joinIntervals(occupied);

            let start = segLo + 2;
            const gaps = [];

            for (const [lo, hi] of merged) {
                if (lo - start > 26) {
                    gaps.push([start, lo]);
                }

                start = Math.max(start, hi);
            }

            if (segHi - start > 26) {
                gaps.push([start, segHi - 2]);
            }

            for (const [gapLo, gapHi] of gaps) {
                let cursor = gapLo + 1;
                let guard = 0;

                while (
                    gapHi - cursor > 22 &&
                    guard++ < 12
                ) {
                    let fit = null;

                    for (const text of nextPool()) {
                        for (const size of [11, 10, 9]) {
                            const w = measureText(text, size);

                            if (cursor + w > gapHi) {
                                continue;
                            }

                            const p = {
                                x: cursor + w / 2,
                                y,
                                text,
                                size,
                                w
                            };

                            if (canPlace(p, placed, 2)) {
                                fit = p;
                                break;
                            }
                        }

                        if (fit) {
                            break;
                        }
                    }

                    if (!fit) {
                        break;
                    }

                    colorize(fit, false);
                    placed.push(fit);

                    cursor += fit.w + 4;
                }
            }
        }
    }

    return placed;
}

// ==========================================
// DIVERSIFICAR IDIOMAS PRÓXIMOS
// ==========================================

function diversify(placed) {
    const seen = [];
    const usage = new Map();

    const sorted = [...placed].sort(
        (a, b) => b.y - a.y || a.x - b.x
    );

    for (const p of sorted) {
        const nearby = seen.filter(
            q =>
                Math.abs(p.x - q.x) < 83 &&
                Math.abs(p.y - q.y) < 59
        );

        const repeated = nearby.some(
            q => q.text === p.text
        );

        if (repeated) {
            const replacements = [];

            for (const word of ALL_PHRASES) {
                if (
                    nearby.some(q => q.text === word)
                ) {
                    continue;
                }

                const width = measureText(
                    word,
                    p.size
                );

                if (
                    width <= p.w &&
                    width >= p.w * 0.72
                ) {
                    replacements.push({
                        word,
                        width,
                        used: usage.get(word) || 0
                    });
                }
            }

            replacements.sort(
                (a, b) =>
                    a.used - b.used ||
                    Math.abs(b.width - p.w) -
                    Math.abs(a.width - p.w)
            );

            if (replacements.length) {
                p.text = replacements[0].word;
                p.w = replacements[0].width;
            }
        }

        usage.set(
            p.text,
            (usage.get(p.text) || 0) + 1
        );

        seen.push(p);
    }
}

// ==========================================
// NOVO PREENCHIMENTO DOS VÃOS
// ==========================================

function fillGaps(placed) {
    const added = [];
    const usage = new Map();

    placed.forEach(p => {
        usage.set(
            p.text,
            (usage.get(p.text) || 0) + 1
        );
    });

    for (
        let y = YMAX - HALF;
        y > YMIN + HALF;
        y -= ROW_H
    ) {
        const safe = intersect(
            spans(y + 8),
            spans(y - 8)
        );

        for (let [lo, hi] of safe) {
            lo += 2;
            hi -= 2;

            const occupied = [];

            for (const p of [...placed, ...added]) {
                if (Math.abs(p.y - y) > 9) {
                    continue;
                }

                occupied.push([
                    p.x - p.w / 2 - 2,
                    p.x + p.w / 2 + 2
                ]);
            }

            const blocked = joinIntervals(occupied);

            let cursor = lo;
            const gaps = [];

            for (const [a, b] of blocked) {
                if (a > cursor) {
                    gaps.push([
                        cursor,
                        Math.min(a, hi)
                    ]);
                }

                cursor = Math.max(cursor, b);

                if (cursor >= hi) {
                    break;
                }
            }

            if (cursor < hi) {
                gaps.push([cursor, hi]);
            }

            for (const [left, right] of gaps) {
                const width = right - left;

                if (width < 17) {
                    continue;
                }

                const nearby = [
                    ...placed,
                    ...added
                ].filter(
                    p =>
                        Math.abs(p.y - y) < 40 &&
                        Math.abs(
                            p.x - (left + right) / 2
                        ) < 82
                );

                const candidates = [];

                // Prioridade: frase inteira
                for (const word of ALL_PHRASES) {
                    if (
                        nearby.some(
                            p => p.text === word
                        )
                    ) {
                        continue;
                    }

                    for (const size of [12, 11, 10, 9]) {
                        const w = measureText(
                            word,
                            size
                        );

                        if (w > width - 2) {
                            continue;
                        }

                        candidates.push({
                            text: word,
                            size,
                            w
                        });
                    }
                }

                candidates.sort((a, b) => {
                    const scoreA =
                        (usage.get(a.text) || 0) * 5 +
                        Math.abs(width - a.w) * 0.25 +
                        (12 - a.size) * 1.8;

                    const scoreB =
                        (usage.get(b.text) || 0) * 5 +
                        Math.abs(width - b.w) * 0.25 +
                        (12 - b.size) * 1.8;

                    return scoreA - scoreB;
                });

                let best = candidates[0];
                let limited = false;

                // Se não couber inteira,
                // permite recortar no espaço.
                if (!best) {
                    const possible = ALL_PHRASES.filter(
                        word =>
                            !nearby.some(
                                p => p.text === word
                            )
                    );

                    const words = (
                        possible.length
                            ? possible
                            : ALL_PHRASES
                    ).slice();

                    words.sort(
                        (a, b) =>
                            measureText(a, 10) -
                            measureText(b, 10)
                    );

                    const word = words[0];

                    best = {
                        text: word,
                        size: 10,
                        w: measureText(word, 10)
                    };

                    limited = true;
                }

                const visible = Math.min(
                    best.w,
                    width - 2
                );

                const start = left + Math.max(
                    0,
                    (width - visible) / 2
                );

                const item = {
                    x: start + best.w / 2,
                    y,
                    text: best.text,
                    size: best.size,
                    w: best.w,

                    // Limites próprios do vão
                    clipLeft: start,
                    clipRight: start + visible,
                    clipTop: y + 9,
                    clipBottom: y - 9,

                    partial: limited
                };

                colorize(item, false);
                added.push(item);

                usage.set(
                    item.text,
                    (usage.get(item.text) || 0) + 1
                );
            }
        }
    }

    return added;
}

// ==========================================
// ORGANIZAÇÃO FINAL
// ==========================================

function build() {
    const base = originalFillVoids(
        buildBase()
    );

    // Distribui melhor os idiomas
    diversify(base);

    // Acrescenta frases aos espaços livres
    const fillers = fillGaps(base);

    const all = [
        ...base,
        ...fillers
    ];

    const edges = base.filter(
        p => p.edge
    );

    const inner = all.filter(
        p => !p.edge
    );

    // Contorno primeiro
    edges.sort((a, b) => {
        const angleA = (
            Math.atan2(a.x, a.y - CY)
            + 2 * Math.PI
        ) % (2 * Math.PI);

        const angleB = (
            Math.atan2(b.x, b.y - CY)
            + 2 * Math.PI
        ) % (2 * Math.PI);

        return angleA - angleB;
    });

    // Depois, preenchimento de fora
    // para dentro do coração
    inner.forEach(p => {
        p.order =
            -p.rad + uniform(0, 0.06);
    });

    inner.sort(
        (a, b) => a.order - b.order
    );

    return [...edges, ...inner];
}

// ==========================================
// TEMPOS DA ANIMAÇÃO
// ==========================================

const ORDER = build();

const FORMATION_MS = DURATION * 1000;
const FINISH_MS = ANIM * TICK;

const CYCLE_MS =
    FORMATION_MS +
    FINISH_MS +
    TEMPO_PARADO;

// ==========================================
// DESENHO DAS FRASES
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

    if (glow) {
        ctx.shadowColor =
            "rgba(255, 35, 65, 0.75)";

        ctx.shadowBlur = BRILHO;
    } else {
        ctx.shadowBlur = 0;
    }

    ctx.fillText(text, x, y);

    ctx.shadowBlur = 0;
    ctx.shadowColor = "transparent";
}

// ==========================================
// MOVIMENTO DAS FRASES
// ==========================================

function drawPhrase(p, elapsed) {
    const u = clamp(
        elapsed / FINISH_MS
    );

    const e = 1 - (1 - u) ** 3;

    const x =
        p.x + p.dx * (1 - e);

    const y =
        -p.y - (1 - e) * LIFT;

    const flash = 0.75 * Math.sin(
        Math.PI * clamp(
            (u - 0.55) / 0.45
        )
    );

    const col = mix(
        mix(
            BGC,
            p.color,
            e ** 1.5
        ),
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
            dim(p.color, 0.40),
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
// FRASES COMPLETAS
// ==========================================

function drawFinished(
    p,
    color = p.color
) {
    ctx.save();

    ctx.shadowColor =
        "rgba(255, 35, 65, 0.6)";

    ctx.shadowBlur =
        BRILHO * INTENSIDADE_BRILHO;

    setFont(p.size);

    ctx.fillStyle = rgb(color);

    ctx.fillText(
        p.text,
        p.x,
        -p.y
    );

    ctx.restore();
}

// ==========================================
// PROTEÇÃO INDIVIDUAL DOS VÃOS
// ==========================================

function drawItem(p, age, color) {
    const hasClip = (
        p.clipLeft !== undefined
    );

    if (hasClip) {
        ctx.save();

        ctx.beginPath();

        ctx.rect(
            p.clipLeft,
            -p.clipTop,
            p.clipRight - p.clipLeft,
            p.clipTop - p.clipBottom
        );

        ctx.clip();
    }

    if (age >= FINISH_MS) {
        drawFinished(
            p,
            color || p.color
        );
    } else if (age >= 0) {
        drawPhrase(p, age);
    }

    if (hasClip) {
        ctx.restore();
    }
}

// ==========================================
// ANIMAÇÃO INFINITA
// ==========================================

let cycleStart = null;

function frame(now) {
    if (cycleStart === null) {
        cycleStart = now;
    }

    const elapsed = (
        now - cycleStart
    ) % CYCLE_MS;

    ctx.fillStyle = BG;

    ctx.fillRect(
        -W / 2,
        -H / 2,
        W,
        H
    );

    ctx.save();

    // Nenhuma palavra ultrapassa
    // o formato do coração
    ctx.clip(HEART_MASK);

    const progress = clamp(
        elapsed / FORMATION_MS
    );

    const count = Math.min(
        ORDER.length,
        Math.floor(
            progress * ORDER.length
        )
    );

    const complete = (
        elapsed >=
        FORMATION_MS + FINISH_MS
    );

    const shimmerIndex = Math.floor(
        elapsed / 140
    ) % Math.max(1, ORDER.length);

    const phase = (
        elapsed % 140
    ) / 140;

    for (let i = 0; i < count; i++) {
        const p = ORDER[i];

        const born =
            i * FORMATION_MS /
            ORDER.length;

        const age = elapsed - born;

        if (
            complete &&
            i === shimmerIndex
        ) {
            const brightness =
                0.6 * Math.sin(
                    Math.PI * phase
                );

            drawItem(
                p,
                age,
                mix(
                    p.color,
                    FLASH,
                    brightness
                )
            );
        } else {
            drawItem(p, age);
        }
    }

    ctx.restore();

    requestAnimationFrame(frame);
}

// ==========================================
// INICIAR
// ==========================================

requestAnimationFrame(frame);
