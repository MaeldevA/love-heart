
"use strict";

// ========================================
// LOVE HEART — EDIÇÃO REFINADA
// ========================================

const CONFIG = {
    largura: 800,
    altura: 800,
    escala: 21,
    deslocamentoY: 20,

    fundo: "#060208",

    // Formação mais suave
    duracao: 15000,
    movimento: 750,
    espera: 3500,

    // Letras legíveis
    tamanhos: [12, 13, 14],
    alturaLinha: 21,
    espaco: 5,

    // Efeitos
    subida: 30,
    brilho: 3
};

const canvas = document.getElementById(
    "heart-canvas"
);

const ctx = canvas.getContext("2d");

const DPR = Math.min(
    window.devicePixelRatio || 1,
    3
);

canvas.width = CONFIG.largura * DPR;
canvas.height = CONFIG.altura * DPR;

canvas.style.width = "100%";
canvas.style.height = "100%";

ctx.setTransform(
    DPR, 0, 0, DPR,
    400 * DPR, 400 * DPR
);

ctx.textAlign = "center";
ctx.textBaseline = "middle";

// ========================================
// IDIOMAS
// ========================================

const FRASES = [
    "Eu te amo",
    "I love you",
    "Te amo",
    "Je t'aime",
    "Ti amo",
    "Ich liebe dich",
    "Seni seviyorum",
    "Kocham cię",
    "Ik hou van jou",
    "Jag älskar dig",
    "Aku cinta kamu",
    "Anh yêu em",
    "Te iubesc",
    "Mahal kita",
    "Volim te",
    "Szeretlek",
    "Jeg elsker deg",
    "Miluji tě",
    "Aishiteru",
    "Я тебя люблю",
    "사랑해",
    "愛してる",
    "我爱你",
    "Σ' αγαπώ",
    "Я тебе кохаю",
    "Te quiero",
    "Eu gosto de você",
    "T'estimo",
    "Nakupenda",
    "Mina rakastan sinua"
];

// ========================================
// ALEATORIEDADE FIXA
// ========================================

let semente = 1122;

function aleatorio() {
    semente = (
        Math.imul(semente, 1664525)
        + 1013904223
    ) >>> 0;

    return semente / 4294967296;
}

function numero(min, max) {
    return min + aleatorio() * (max - min);
}

function misturar(lista) {
    const copia = [...lista];

    for (let i = copia.length - 1; i > 0; i--) {
        const j = Math.floor(
            aleatorio() * (i + 1)
        );

        [copia[i], copia[j]] = [
            copia[j], copia[i]
        ];
    }

    return copia;
}

function limitar(x) {
    return Math.max(0, Math.min(1, x));
}

function interpolar(a, b, v) {
    return a.map(
        (x, i) => x + (b[i] - x) * v
    );
}

function corRGB(c) {
    return "rgb(" + c.map(
        v => Math.round(limitar(v) * 255)
    ).join(",") + ")";
}

// ========================================
// CORAÇÃO MATEMÁTICO ORIGINAL
// ========================================

function coracao(t) {
    const x = 16 * Math.sin(t) ** 3;

    const y =
        13 * Math.cos(t)
        - 5 * Math.cos(2 * t)
        - 2 * Math.cos(3 * t)
        - Math.cos(4 * t);

    return {
        x: x * CONFIG.escala,
        y: y * CONFIG.escala
            + CONFIG.deslocamentoY
    };
}

const pontos = [];

for (let i = 0; i < 1440; i++) {
    pontos.push(
        coracao(i * Math.PI * 2 / 1440)
    );
}

const minimoY = Math.min(
    ...pontos.map(p => p.y)
);

const maximoY = Math.max(
    ...pontos.map(p => p.y)
);

const centroY = (minimoY + maximoY) / 2;

// Contorno usado como limite absoluto
const mascara = new Path2D();

pontos.forEach((p, i) => {
    if (i === 0) {
        mascara.moveTo(p.x, -p.y);
    } else {
        mascara.lineTo(p.x, -p.y);
    }
});

mascara.closePath();

// ========================================
// INTERSEÇÃO HORIZONTAL
// ========================================

function intervalos(y) {
    const xs = [];

    for (let i = 0; i < pontos.length; i++) {
        const a = pontos[i];
        const b = pontos[(i + 1) % pontos.length];

        if (
            (a.y <= y && y < b.y) ||
            (b.y <= y && y < a.y)
        ) {
            xs.push(
                a.x +
                (y - a.y) *
                (b.x - a.x) /
                (b.y - a.y)
            );
        }
    }

    xs.sort((a, b) => a - b);

    const resultado = [];

    for (let i = 0; i + 1 < xs.length; i += 2) {
        resultado.push([
            xs[i], xs[i + 1]
        ]);
    }

    return resultado;
}

// Obtém regiões seguras para cada linha
function faixasSeguras(y, altura = 17) {
    const amostras = [
        y - altura / 2,
        y - altura / 4,
        y,
        y + altura / 4,
        y + altura / 2
    ];

    let atuais = intervalos(amostras[0]);

    for (const amostra of amostras.slice(1)) {
        const proximas = intervalos(amostra);
        const novas = [];

        for (const [a, b] of atuais) {
            for (const [c, d] of proximas) {
                const inicio = Math.max(a, c);
                const fim = Math.min(b, d);

                if (fim > inicio) {
                    novas.push([inicio, fim]);
                }
            }
        }

        atuais = novas;
    }

    return atuais
        .map(([a, b]) => [a + 3, b - 3])
        .filter(([a, b]) => b - a >= 20);
}

// ========================================
// FONTES E MEDIDAS
// ========================================

function definirFonte(tamanho) {
    ctx.font =
        `bold ${tamanho}px Arial, sans-serif`;
}

function larguraTexto(frase, tamanho) {
    definirFonte(tamanho);

    return ctx.measureText(frase).width;
}

// ========================================
// DISTRIBUIÇÃO DAS FRASES
// ========================================

function criarCoracao() {
    const palavras = [];
    let fila = [];

    // Alterna idiomas para evitar
    // repetições consecutivas.
    function proximaRodada() {
        fila = misturar(FRASES);
    }

    proximaRodada();

    let ultimaFrase = "";

    function candidatas() {
        if (fila.length < 5) {
            proximaRodada();
        }

        return [
            ...fila.slice(0, 12),
            ...FRASES.filter(f =>
                f.length <= 9
            )
        ];
    }

    const margem = 4;

    for (
        let y = maximoY - 10;
        y > minimoY + 10;
        y -= CONFIG.alturaLinha
    ) {
        const regioes = faixasSeguras(y);

        for (const [inicio, fim] of regioes) {
            const disponivel =
                fim - inicio - margem * 2;

            if (disponivel < 25) continue;

            const linha = [];
            let cursor = inicio + margem;

            while (cursor < fim - margem) {
                const restante =
                    fim - margem - cursor;

                const possibilidades = [];

                for (const frase of candidatas()) {
                    if (frase === ultimaFrase) {
                        continue;
                    }

                    for (
                        const tamanho of
                        CONFIG.tamanhos
                    ) {
                        const largura = larguraTexto(
                            frase, tamanho
                        );

                        if (largura <= restante) {
                            possibilidades.push({
                                frase,
                                tamanho,
                                largura
                            });
                        }
                    }
                }

                if (!possibilidades.length) {
                    break;
                }

                // Escolhe frases variadas que
                // aproveitam melhor o espaço.
                const alvo = Math.min(
                    restante,
                    numero(45, 110)
                );

                possibilidades.sort((a, b) => {
                    const custoA =
                        Math.abs(a.largura - alvo)
                        + (14 - a.tamanho) * 3;

                    const custoB =
                        Math.abs(b.largura - alvo)
                        + (14 - b.tamanho) * 3;

                    return custoA - custoB;
                });

                const quantidadeOpcoes = Math.min(
                    5, possibilidades.length
                );

                const escolha = possibilidades[
                    Math.floor(
                        aleatorio() * quantidadeOpcoes
                    )
                ];

                // Evita repetição imediata
                ultimaFrase = escolha.frase;

                const indice = fila.indexOf(
                    escolha.frase
                );

                if (indice !== -1) {
                    fila.splice(indice, 1);
                }

                linha.push({
                    x: cursor + escolha.largura / 2,
                    y,
                    texto: escolha.frase,
                    tamanho: escolha.tamanho,
                    largura: escolha.largura
                });

                cursor +=
                    escolha.largura +
                    CONFIG.espaco;
            }

            if (!linha.length) continue;

            // Centraliza a linha dentro
            // da região disponível.
            const esquerda =
                linha[0].x -
                linha[0].largura / 2;

            const ultima = linha[
                linha.length - 1
            ];

            const direita =
                ultima.x + ultima.largura / 2;

            const deslocamento =
                (inicio + fim - esquerda - direita) / 2;

            linha.forEach(p => {
                p.x += deslocamento;
            });

            linha.forEach((p, i) => {
                p.borda =
                    i === 0 ||
                    i === linha.length - 1;

                const distancia = Math.min(
                    1,
                    Math.hypot(
                        p.x / (16 * CONFIG.escala),
                        (p.y - centroY) /
                        (14.5 * CONFIG.escala)
                    )
                );

                // Tons de vermelho vivos,
                // preservando variação natural.
                const vinho = [0.72, 0.035, 0.12];
                const vermelho = [0.99, 0.12, 0.22];
                const claro = [1, 0.22, 0.31];

                let cor = interpolar(
                    vinho,
                    vermelho,
                    0.35 + distancia * 0.65
                );

                cor = interpolar(
                    cor,
                    claro,
                    numero(0, 0.22) +
                    (p.borda ? 0.18 : 0)
                ).map(limitar);

                palavras.push({
                    ...p,
                    cor,
                    distancia,
                    dx: numero(-8, 8)
                });
            });
        }
    }

    // Contorno primeiro
    const bordas = palavras.filter(
        p => p.borda
    );

    // Interior depois
    const interior = palavras.filter(
        p => !p.borda
    );

    bordas.sort((a, b) => {
        const aa = (
            Math.atan2(
                a.x, a.y - centroY
            ) + 2 * Math.PI
        ) % (2 * Math.PI);

        const bb = (
            Math.atan2(
                b.x, b.y - centroY
            ) + 2 * Math.PI
        ) % (2 * Math.PI);

        return aa - bb;
    });

    interior.forEach(p => {
        p.ordem = -p.distancia +
            numero(0, 0.045);
    });

    interior.sort(
        (a, b) => a.ordem - b.ordem
    );

    return [...bordas, ...interior];
}

const PALAVRAS = criarCoracao();

// ========================================
// DESENHO DAS LETRAS
// ========================================

const FUNDO_RGB = [
    6 / 255,
    2 / 255,
    8 / 255
];

const FLASH = [1, 0.75, 0.79];

function desenharTexto(p, x, y, cor) {
    definirFonte(p.tamanho);

    ctx.shadowColor = "rgba(255,45,75,0.48)";
    ctx.shadowBlur = CONFIG.brilho;

    ctx.fillStyle = corRGB(cor);
    ctx.fillText(p.texto, x, y);

    ctx.shadowBlur = 0;
    ctx.shadowColor = "transparent";
}

function desenharPalavra(p, idade, destaque) {
    if (idade >= CONFIG.movimento) {
        const cor = destaque
            ? interpolar(p.cor, FLASH, 0.58)
            : p.cor;

        desenharTexto(
            p,
            p.x,
            -p.y,
            cor
        );

        return;
    }

    const progresso = limitar(
        idade / CONFIG.movimento
    );

    const suavidade =
        1 - Math.pow(1 - progresso, 3);

    const x = p.x +
        p.dx * (1 - suavidade);

    const y = -p.y -
        CONFIG.subida * (1 - suavidade);

    const brilhoEntrada =
        0.7 * Math.sin(
            Math.PI * limitar(
                (progresso - 0.55) / 0.45
            )
        );

    const cor = interpolar(
        interpolar(
            FUNDO_RGB,
            p.cor,
            suavidade ** 1.5
        ),
        FLASH,
        brilhoEntrada
    );

    desenharTexto(p, x, y, cor);
}

// ========================================
// ANIMAÇÃO INFINITA
// ========================================

const CICLO =
    CONFIG.duracao +
    CONFIG.movimento +
    CONFIG.espera;

let inicioCiclo = null;

function animar(agora) {
    if (inicioCiclo === null) {
        inicioCiclo = agora;
    }

    const tempo =
        (agora - inicioCiclo) % CICLO;

    // Limpa completamente o canvas
    ctx.fillStyle = CONFIG.fundo;

    ctx.fillRect(-400, -400, 800, 800);

    // Proteção para nenhuma letra
    // ultrapassar o coração
    ctx.save();
    ctx.clip(mascara);

    const progresso = limitar(
        tempo / CONFIG.duracao
    );

    const quantidade = Math.min(
        PALAVRAS.length,
        Math.floor(
            PALAVRAS.length * progresso
        )
    );

    const completo =
        tempo >= CONFIG.duracao +
        CONFIG.movimento;

    const destaque = Math.floor(
        tempo / 220
    ) % Math.max(1, PALAVRAS.length);

    for (let i = 0; i < quantidade; i++) {
        const p = PALAVRAS[i];

        const nascimento =
            i * CONFIG.duracao /
            PALAVRAS.length;

        const idade = tempo - nascimento;

        desenharPalavra(
            p,
            idade,
            completo && i === destaque
        );
    }

    ctx.restore();

    requestAnimationFrame(animar);
}

requestAnimationFrame(animar);

