/* Mede as costuras 06→07 e 07→08 na página inteira: põe o topo da cena seguinte a 100%,
   80% e 62% da tela, espera assentar e compara a linha de pixels logo acima e logo abaixo
   da costura nas duas bordas laterais. Também diz se o título da 08 já está à vista.
     node scripts/07-emendas.mjs   (rode depois do build) */
import { chromium, firefox } from "playwright";
import { servir } from "../serve.mjs";

const ARGS_CHROMIUM = ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"];
const COSTURAS = [
  ["unidades", "comunidade"],
  ["comunidade", "proposta"],
];

async function medir(pagina, viewport, proxima, pct) {
  const alvo = await pagina.evaluate(
    ([id, p]) => {
      const el = document.getElementById(id);
      if (!el) throw new Error(`#${id} ausente`);
      return Math.round(el.getBoundingClientRect().top + scrollY - innerHeight * p);
    },
    [proxima, pct / 100],
  );
  for (let k = 0; k < 2; k += 1) {
    await pagina.evaluate((y) => scrollTo(0, y), alvo);
    await pagina.waitForTimeout(1400);
  }
  return pagina.evaluate((id) => {
    const y = Math.round(document.getElementById(id).getBoundingClientRect().top);
    const titulo = document.querySelector("#proposta .proposta-titulo .linha-interna");
    const visivel = titulo ? titulo.getBoundingClientRect().top < innerHeight : null;
    return { y, visivel };
  }, proxima);
}

function degrau(png, largura) {
  // png: Buffer RGBA cru de uma faixa de 4 linhas começando em y-2
  const px = (x, l) => {
    const i = (l * largura + x) * 4;
    return [png[i], png[i + 1], png[i + 2]];
  };
  return [14, largura - 15].map((x) => {
    const a = px(x, 0);
    const b = px(x, 3);
    return { x, a, b, d: Math.max(...a.map((v, i) => Math.abs(v - b[i]))) };
  });
}

async function rodar(nome, tipo, viewport, linhas) {
  const navegador = await tipo.launch(nome === "chromium" ? { args: ARGS_CHROMIUM } : {});
  try {
    const pagina = await navegador.newPage({ viewport });
    const erros = [];
    pagina.on("console", (m) => m.type() === "error" && erros.push(m.text()));
    await pagina.goto(globalThis.URL_BASE, { waitUntil: "load" });
    await pagina.waitForFunction(() => document.documentElement.classList.contains("motion"));
    for (const [antes, proxima] of COSTURAS) {
      for (const pct of [100, 80, 62]) {
        const { y, visivel } = await medir(pagina, viewport, proxima, pct);
        const buf = await pagina.screenshot({
          clip: {
            x: 0,
            y: Math.max(0, Math.min(y - 2, viewport.height - 4)),
            width: viewport.width,
            height: 4,
          },
        });
        const { data, largura } = await decodificar(pagina, buf);
        const r = degrau(data, largura);
        const pior = Math.max(...r.map((m) => m.d));
        linhas.push(
          `${nome} ${viewport.width} ${antes}->${proxima} topo@${pct}%: degrau ${pior} ` +
            r.map((m) => `x${m.x}(${m.a}->${m.b})`).join(" ") +
            (proxima === "proposta" ? ` · título da 08 à vista: ${visivel}` : ""),
        );
      }
    }
    for (const e of erros) linhas.push(`${nome} ${viewport.width} ERRO console: ${e}`);
  } finally {
    await navegador.close();
  }
}

/** Decodifica o PNG no próprio navegador (sem dependência extra). */
async function decodificar(pagina, buf) {
  return pagina.evaluate(async (b64) => {
    const img = new Image();
    img.src = `data:image/png;base64,${b64}`;
    await img.decode();
    const c = document.createElement("canvas");
    c.width = img.width;
    c.height = img.height;
    const ctx = c.getContext("2d");
    if (!ctx) throw new Error("sem canvas 2D");
    ctx.drawImage(img, 0, 0);
    return { data: Array.from(ctx.getImageData(0, 0, c.width, c.height).data), largura: c.width };
  }, buf.toString("base64"));
}

const servidor = await servir();
globalThis.URL_BASE = servidor.url;
const linhas = [];
try {
  for (const [nome, tipo] of [
    ["chromium", chromium],
    ["firefox", firefox],
  ]) {
    for (const viewport of [
      { width: 1440, height: 900 },
      { width: 390, height: 844 },
    ]) {
      await rodar(nome, tipo, viewport, linhas);
    }
  }
} finally {
  await servidor.fechar();
}
console.log(linhas.join("\n"));
