
"use strict";

// ==========================================
// LOVE HEART — VERSÃO ORIGINAL APROVADA
// ÚNICA CORREÇÃO: LIMITAR AS PALAVRAS
// AO FORMATO DO CORAÇÃO
// ==========================================

// CONFIGURAÇÕES ORIGINAIS

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
// ALEATORIEDADE ORIGINAL
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

function hexToRGB(hex) {
    return [1, 3, 5].map(
        i => parseInt(
            hex.slice(i, i + 2), 16
        ) / 255
    );
}

const BGC = hexToRGB(BG);

const FLASH = [1, 0.78, 0.78];

// ==========================================
// FORMATO MATEMÁTICO ORIGINAL
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

const POLY = [];

for (let i = 0; i < 720; i++) {
    POLY.push(
        heart(2 * Math.PI * i / 720)
    );
}

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
// NOVO: MÁSCARA DO CORAÇÃO
// ==========================================

// Usa exatamente o mesmo contorno
// matemático da versão original.
//
// As letras continuam nos mesmos lugares.
// Somente as partes que ultrapassarem
// o desenho serão escondidas.

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
// INTERSEÇÕES ORIGINAIS
// ==========================================

function spans(y) {
    const xs = [];

    for (const [[x1, y1], [x2, y2]] of EDGES) {
        if (
            (y1 <= y && y < y2)
            || (y2 <= y && y < y1)
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
// FONTES ORIGINAIS
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

// ==========================================
// DISTÂNCIA ORIGINAL
// ==========================================

function mathDist(x, y) {
    return Math.hypot(
        x / (16 * SC),
        (y - CY) / (14.5 * SC)
    );
}

// ==========================================
// CONSTRUÇÃO ORIGINAL DO CORAÇÃO
// ==========================================

function build() {
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

    let y = YMAX - HALF;

    while (y > YMIN + HALF) {
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
                    const w = measureText(
                        text, size
                    );

                    if (cur + w <= hi) {
                        fit = { text, size, w };
                        break;
                    }
                }

                if (!fit) {
                    break;
                }

                const { text, size, w } = fit;

                line.push({
                    x: cur + w / 2,
                    text,
                    size,
                    w
                });

                cur += w + GAP;
            }

            if (line.length === 0) {
                continue;
            }

            if (line.length > 1) {
                const last = line[line.length - 1];

                const left = hi - (
                    last.x + last.w / 2
                );

                line.forEach((item, i) => {
                    item.x += (
                        left * i
                        / (line.length - 1)
                    );
                });
            } else {
                line[0].x = (lo + hi) / 2;
            }

            line.forEach((item, i) => {
                placed.push({
                    x: item.x,
                    y,
                    text: item.text,
                    size: item.size,
                    edge: (
                        i === 0
                        || i === line.length - 1
                    )
                });
            });
        }

        y -= ROW_H;
    }

    // Tons da versão aprovada

    const wine = [0.76, 0.055, 0.14];
    const crimson = [1.0, 0.14, 0.23];
    const blood = [1.0, 0.24, 0.32];

    for (const p of placed) {
        const rad = Math.min(
            1,
            mathDist(p.x, p.y)
        );

        let base = mix(
            wine,
            crimson,
            0.25 + 0.75 * rad
        );

        base = mix(
            base,
            blood,
            uniform(0, 0.22)
            + (p.edge ? 0.22 : 0)
        );

        p.color = base.map(clamp);
        p.rad = rad;
    }

    // Contorno primeiro

    const edges = placed.filter(
        p => p.edge
    );

    // Interior depois

    const inner = placed.filter(
        p => !p.edge
    );

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

    for (const p of inner) {
        p.sortValue = (
            -p.rad + uniform(0, 0.08)
        );
    }

    inner.sort(
        (a, b) => a.sortValue - b.sortValue
    );

    return [...edges, ...inner];
}

// ==========================================
// TEMPOS ORIGINAIS
// ==========================================

const ORDER = build();

const FORMATION_MS = DURATION * 1000;
const FINISH_MS = ANIM * TICK;

const CYCLE_MS = (
    FORMATION_MS
    + FINISH_MS
    + TEMPO_PARADO
);

for (const p of ORDER) {
    p.dx = uniform(-10, 10);
}

// ==========================================
// DESENHO ORIGINAL DAS LETRAS
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
// FRASE SURGINDO
// ==========================================

function drawPhrase(p, elapsed) {
    const u = clamp(
        elapsed / FINISH_MS
    );

    const e = 1 - Math.pow(1 - u, 3);

    const x = p.x + p.dx * (1 - e);
    const y = -p.y - (1 - e) * LIFT;

    const flash = (
        0.75
        * Math.sin(
            Math.PI * clamp(
                (u - 0.55) / 0.45
            )
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

    // Halo original

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

    // Texto principal

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
// ANIMAÇÃO INFINITA ORIGINAL
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

    // Limpa a tela normalmente

    ctx.fillStyle = BG;

    ctx.fillRect(
        -W / 2,
        -H / 2,
        W,
        H
    );

    // ======================================
    // ÚNICA ALTERAÇÃO DA VERSÃO ORIGINAL
    // ======================================

    // Protege o contorno matemático.
    // Nenhuma letra poderá ser desenhada
    // visualmente fora deste formato.

    ctx.save();
    ctx.clip(HEART_MASK);

    // ======================================
    // RESTANTE DA ANIMAÇÃO ORIGINAL
    // ======================================

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

    const phase = (elapsed % 140) / 140;

    for (let i = 0; i < count; i++) {
        const p = ORDER[i];

        const born = (
            i * FORMATION_MS
            / ORDER.length
        );

        const age = elapsed - born;

        if (age >= FINISH_MS) {
            if (
                complete
                && i === shimmerIndex
            ) {
                const brightness = (
                    0.6
                    * Math.sin(
                        Math.PI * phase
                    )
                );

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

    // Finaliza a máscara sem afetar
    // os próximos quadros da animação.

    ctx.restore();

    requestAnimationFrame(frame);
}

// ==========================================
// INICIAR
// ==========================================

requestAnimationFrame(frame);
