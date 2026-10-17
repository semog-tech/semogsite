/* Servidor estático mínimo para dist/ (pnpm dev e scripts/capturar.mjs). A página também
   abre por file://. Porta: PORTA do ambiente ou 4180; se ocupada, tenta as dez seguintes. */
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const DIST = fileURLToPath(new URL("./dist/", import.meta.url));
const TIPOS = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json",
  ".map": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
  ".mp4": "video/mp4",
  ".woff2": "font/woff2",
  ".txt": "text/plain; charset=utf-8",
};

/** Resolve a URL dentro de dist/; devolve null se tentar sair dela. */
function caminhoSeguro(url) {
  let pathname;
  try {
    pathname = decodeURIComponent(new URL(url, "http://local").pathname);
  } catch {
    return null; // URL malformada: tratada como proibida.
  }
  const relativo = pathname.endsWith("/") ? `${pathname}index.html` : pathname;
  const absoluto = normalize(join(DIST, relativo));
  return absoluto.startsWith(normalize(DIST)) ? absoluto : null;
}

async function responder(req, res) {
  const caminho = caminhoSeguro(req.url ?? "/");
  if (!caminho) {
    res.writeHead(403).end("Proibido");
    return;
  }
  try {
    const corpo = await readFile(caminho);
    const tipo = TIPOS[extname(caminho)] ?? "application/octet-stream";
    res.writeHead(200, { "Content-Type": tipo, "Cache-Control": "no-store" }).end(corpo);
  } catch (erro) {
    const ausente = erro && typeof erro === "object" && "code" in erro && erro.code === "ENOENT";
    if (!ausente) console.error(`[serve] ${req.url}:`, erro);
    res.writeHead(ausente ? 404 : 500).end(ausente ? "Não encontrado" : "Erro interno");
  }
}

/**
 * Sobe o servidor na primeira porta livre a partir de `porta`.
 * @param {number} porta
 * @returns {Promise<{ url: string, fechar: () => Promise<void> }>}
 */
export function servir(porta = Number(process.env.PORTA ?? 4180)) {
  return new Promise((resolver, rejeitar) => {
    const tentar = (p, restantes) => {
      const servidor = createServer((req, res) => {
        responder(req, res).catch((erro) => {
          console.error("[serve] falha inesperada:", erro);
          if (!res.headersSent) res.writeHead(500).end("Erro interno");
        });
      });
      servidor.once("error", (erro) => {
        if (erro.code === "EADDRINUSE" && restantes > 0) tentar(p + 1, restantes - 1);
        else rejeitar(erro);
      });
      servidor.listen(p, "127.0.0.1", () =>
        resolver({
          url: `http://127.0.0.1:${p}/`,
          fechar: () => new Promise((ok) => servidor.close(() => ok())),
        }),
      );
    };
    tentar(porta, 10);
  });
}

// Executado direto (pnpm dev): sobe e fica no ar.
if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  servir()
    .then(({ url }) => console.log(`Servindo dist/ em ${url}`))
    .catch((erro) => {
      console.error("[serve] não subiu:", erro.message);
      process.exit(1);
    });
}
