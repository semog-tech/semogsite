/* Entrada das páginas de leitura (blog, posts, Privacidade e Termos). Leitura não tem
   pin nem rolagem sequestrada: rolagem nativa, sem Lenis nem GSAP. A entrada do título é
   animação de CSS (scenes/leitura/02-artigo.css) e não depende deste arquivo. Aqui:
   - menu do header e pedido de proposta (os mesmos módulos das outras páginas);
   - o header ganha fundo depois do primeiro respiro de rolagem;
   - a barra de progresso acompanha o corpo do texto;
   - o índice marca o trecho que está sendo lido;
   - as fotos adiadas carregam antes de imprimir. */
import { iniciarMenu } from "./core/cabecalho.js";
import { iniciarFormulariosProposta } from "./core/formulario-proposta.js";

const ROLAGEM_PARA_FUNDO = 8;

/** @param {() => void} atualizar */
function aoRolarNativo(atualizar) {
  window.addEventListener("scroll", atualizar, { passive: true });
  window.addEventListener("resize", atualizar, { passive: true });
  atualizar();
}

function fundoDoCabecalho() {
  const cabecalho = document.querySelector("[data-cabecalho]");
  if (!(cabecalho instanceof HTMLElement)) {
    console.error("[leitura] Header [data-cabecalho] não encontrado.");
    return;
  }
  aoRolarNativo(() => cabecalho.toggleAttribute("data-rolou", window.scrollY > ROLAGEM_PARA_FUNDO));
}

/** Altura do header fixo, lida do token. */
function alturaDoCabecalho() {
  const valor = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--cab"));
  return Number.isFinite(valor) ? valor : 0;
}

/** Fração lida do corpo: 0 com o início dele sob o header, 1 com o fim no pé da tela. */
function progressoDaLeitura() {
  const barra = document.querySelector("[data-progresso]");
  const corpo = document.querySelector("[data-corpo-leitura]");
  if (!barra && !corpo) return; // índice do blog: não há texto corrido
  if (!(barra instanceof HTMLElement) || !(corpo instanceof HTMLElement)) {
    console.error("[leitura] Barra [data-progresso] sem [data-corpo-leitura], ou o inverso.");
    return;
  }
  const cab = alturaDoCabecalho();
  aoRolarNativo(() => {
    const caixa = corpo.getBoundingClientRect();
    const percurso = caixa.height - (window.innerHeight - cab);
    const lido = percurso > 0 ? (cab - caixa.top) / percurso : caixa.top < cab ? 1 : 0;
    barra.style.transform = `scaleX(${Math.min(1, Math.max(0, lido))})`;
  });
}

/** O link do índice cujo título já passou da linha de leitura recebe aria-current. */
function indiceAtivo() {
  const links = Array.from(document.querySelectorAll("[data-indice] a[href^='#']"));
  if (!links.length) return;
  const pares = links.flatMap((link) => {
    const alvo = document.getElementById(link.getAttribute("href").slice(1));
    if (!alvo) console.error(`[leitura] Índice aponta para ${link.getAttribute("href")} ausente.`);
    return alvo ? [{ link, alvo }] : [];
  });
  const linha = () => alturaDoCabecalho() + window.innerHeight * 0.25;
  aoRolarNativo(() => {
    const y = linha();
    let atual = null;
    for (const par of pares) if (par.alvo.getBoundingClientRect().top <= y) atual = par;
    for (const { link } of pares) {
      if (link === atual?.link) link.setAttribute("aria-current", "location");
      else link.removeAttribute("aria-current");
    }
  });
}

/**
 * Fotos com loading="lazy" fora da tela saem como caixa vazia na impressão. Passam a
 * eager depois da carga (sem disputar banda com a primeira dobra) e de novo antes de
 * imprimir. É o mesmo cuidado de core/impressao.js, que aqui não entra: ele traz o GSAP.
 */
function fotosParaImpressao() {
  const carregar = () => {
    for (const img of document.querySelectorAll('img[loading="lazy"]')) {
      if (img instanceof HTMLImageElement) img.loading = "eager";
    }
  };
  const agendar = () => window.setTimeout(carregar, 2000);
  if (document.readyState === "complete") agendar();
  else window.addEventListener("load", agendar, { once: true });
  window.addEventListener("beforeprint", carregar);
}

for (const [nome, ligar] of [
  ["menu", iniciarMenu],
  ["formulário de proposta", iniciarFormulariosProposta],
  ["header", fundoDoCabecalho],
  ["progresso de leitura", progressoDaLeitura],
  ["índice", indiceAtivo],
  ["fotos da impressão", fotosParaImpressao],
]) {
  try {
    ligar();
  } catch (erro) {
    console.error(`[leitura] ${nome} não ligou.`, erro);
  }
}

// Nada espera movimento aqui: o esqueleto libera os .entrada (o pedido de proposta) já.
document.documentElement.classList.remove("sem-js");
document.documentElement.classList.add("js", "motion");
