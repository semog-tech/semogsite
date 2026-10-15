/* LCP e FCP das landings com rede e CPU limitadas (Chromium, perfil de celular do
   Lighthouse: ~1,6 Mbps, 150 ms de RTT, CPU 4× mais lenta), em 390×844, com a home como
   comparação. Três cargas por página, cache vazio; imprime a mediana. Rode depois do build.
   O servidor local não comprime: os pesos são os do arquivo, o pior caso. */
import { chromium } from "playwright";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { servir } from "../serve.mjs";

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), "..");
const REDE = {
  offline: false,
  latency: 150,
  downloadThroughput: 200_000,
  uploadThroughput: 84_000,
};
const CARGAS = 3;

async function medir(navegador, url) {
  const contexto = await navegador.newContext({ viewport: { width: 390, height: 844 } });
  const pagina = await contexto.newPage();
  const cdp = await contexto.newCDPSession(pagina);
  await cdp.send("Network.enable");
  await cdp.send("Network.setCacheDisabled", { cacheDisabled: true });
  await cdp.send("Network.emulateNetworkConditions", REDE);
  await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });
  await pagina.addInitScript(() => {
    const v = { lcp: 0, alvo: "" };
    Object.defineProperty(window, "__lcp", { value: v });
    new PerformanceObserver((lista) => {
      for (const e of lista.getEntries()) {
        v.lcp = e.startTime;
        v.alvo = e.element ? e.element.tagName.toLowerCase() : "(removido)";
      }
    }).observe({ type: "largest-contentful-paint", buffered: true });
  });
  try {
    await pagina.goto(url, { waitUntil: "load", timeout: 120_000 });
    await pagina.waitForTimeout(2500);
    return await pagina.evaluate(() => ({
      lcp: Math.round(window.__lcp.lcp),
      alvo: window.__lcp.alvo,
      fcp: Math.round(performance.getEntriesByName("first-contentful-paint")[0]?.startTime ?? -1),
      load: Math.round(performance.getEntriesByType("navigation")[0].loadEventEnd),
    }));
  } finally {
    await contexto.close();
  }
}

const mediana = (xs) => [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)];

const paginas = JSON.parse(readFileSync(join(RAIZ, "src", "paginas.json"), "utf8"));
const alvos = paginas.filter((p) => p.landing || p.saida === "index.html");
const servidor = await servir();
const navegador = await chromium.launch();
try {
  for (const p of alvos) {
    const url = new URL(p.saida, servidor.url).href;
    const medidas = [];
    for (let i = 0; i < CARGAS; i++) medidas.push(await medir(navegador, url));
    console.log(
      `${p.saida}: FCP ${mediana(medidas.map((m) => m.fcp))} ms · LCP ${mediana(medidas.map((m) => m.lcp))} ms` +
        ` (${medidas.map((m) => m.alvo).join("/")}) · load ${mediana(medidas.map((m) => m.load))} ms`,
    );
  }
} finally {
  await navegador.close();
  await servidor.fechar();
}
