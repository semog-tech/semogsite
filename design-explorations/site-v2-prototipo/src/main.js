/* Entrada do app, a mesma em todas as páginas. O <main data-pagina> diz qual lista de
   cenas montar (src/paginas/*.js, na ordem de src/paginas.json). Cada cena inicia
   isolada: erro numa cena é logado, a cena volta ao HTML estático e as outras seguem. */
import {
  gsap,
  ScrollTrigger,
  SplitText,
  iniciarLenis,
  marcarMotionQuandoPronto,
  vigiarAltura,
} from "./core/motion.js";
import { assentarPosicao, irAoTopoParaMontar, reancorar } from "./core/posicao.js";
import { iniciarTema } from "./core/tema.js";
import { iniciarImpressao } from "./core/impressao.js";
import { iniciarMenu } from "./core/cabecalho.js";
import { iniciarFormularios } from "./core/formularios.js";
import { iniciarFormulariosProposta } from "./core/formulario-proposta.js";
import * as util from "./core/util.js";
import conteudo from "./conteudo.json";

import { CENAS as CENAS_HOME } from "./paginas/home.js";
import { CENAS as CENAS_SEMOG } from "./paginas/semog.js";
import { CENAS as CENAS_INCORPORADORAS } from "./paginas/incorporadoras.js";
import { CENAS as CENAS_TECNOLOGIA } from "./paginas/tecnologia.js";
import { CENAS as CENAS_GARANTE } from "./paginas/garante.js";
import { CENAS as CENAS_GESTAO } from "./paginas/gestao.js";

/** @type {Record<string, import("./core/tipos.js").ListaCenas>} */
const PAGINAS = {
  home: CENAS_HOME,
  semog: CENAS_SEMOG,
  incorporadoras: CENAS_INCORPORADORAS,
  tecnologia: CENAS_TECNOLOGIA,
  garante: CENAS_GARANTE,
  gestao: CENAS_GESTAO,
};

/** Cenas da página atual; página desconhecida não monta nenhuma e diz por quê. */
function cenasDaPagina() {
  const main = document.querySelector("main[data-pagina]");
  const id = main instanceof HTMLElement ? main.dataset.pagina : undefined;
  const cenas = id ? PAGINAS[id] : undefined;
  if (!cenas) console.error(`[app] página "${id}" sem lista de cenas em main.js.`);
  return cenas ?? [];
}

/**
 * Desfaz o que a cena montou: o gsap.context reverte tweens, ScrollTriggers e
 * SplitTexts criados no init; gatilhos criados fora dele (após await) são mortos.
 * @param {HTMLElement} root @param {gsap.Context} contexto
 */
function neutralizarCena(root, contexto) {
  contexto.revert();
  for (const gatilho of ScrollTrigger.getAll()) {
    const alvo = gatilho.trigger;
    if (alvo instanceof Element && root.contains(alvo)) gatilho.kill(true);
  }
  root.dataset.cenaErro = "";
}

/**
 * Uma exceção no meio de um refresh do ScrollTrigger deixa os pins das OUTRAS cenas
 * revertidos (sem espaçador). Depois de neutralizar a cena que falhou, um refresh global
 * remonta os pins de todas. Fora da montagem (falha assíncrona) ele vai para o próximo
 * tique; durante a montagem, o refresh de `assentarPosicao` já cobre.
 * @param {string} id @param {HTMLElement} root @param {gsap.Context} contexto @param {unknown} erro
 */
function falhaDeCena(id, root, contexto, erro) {
  console.error(`[cena ${id}] falhou ao iniciar; segue em HTML estático.`, erro);
  try {
    neutralizarCena(root, contexto);
  } catch (erroLimpeza) {
    console.error(`[cena ${id}] falhou também ao neutralizar.`, erroLimpeza);
  }
  if (!montando) gsap.delayedCall(0, () => ScrollTrigger.refresh(true));
}

let montando = false;

/**
 * Cada cena roda dentro de um gsap.context com escopo no root: seletores em texto
 * (gsap.to(".x")) ficam restritos à seção e tudo pode ser revertido se falhar.
 * @param {Omit<import("./core/tipos.js").ContextoCena, "root">} base
 */
function iniciarCenas(base) {
  for (const [id, init] of cenasDaPagina()) {
    const root = document.getElementById(id);
    if (!root) {
      console.error(`[cena ${id}] <section id="${id}"> não está na página.`);
      continue;
    }
    const contexto = gsap.context(() => {}, root);
    try {
      const retorno = contexto.add(() => init({ ...base, root }));
      if (retorno instanceof Promise) {
        retorno.catch((erro) => falhaDeCena(id, root, contexto, erro));
      }
    } catch (erro) {
      falhaDeCena(id, root, contexto, erro);
    }
  }
}

function iniciar() {
  if ("scrollRestoration" in history) history.scrollRestoration = "manual";
  const lenis = iniciarLenis();
  // As cenas montam com a página no topo; ver core/posicao.js.
  const yHerdado = irAoTopoParaMontar(lenis);
  const pronto = marcarMotionQuandoPronto();
  montando = true;
  iniciarCenas({
    gsap,
    ScrollTrigger,
    SplitText,
    lenis,
    util,
    conteudo,
    pronto,
    estreito: util.estreito,
  });
  montando = false;
  assentarPosicao(lenis, yHerdado);
  iniciarTema(lenis);
  iniciarImpressao();
  vigiarAltura();
  pronto.then(
    () => reancorar(lenis),
    (erro) => console.error("[motion] não marcou .motion.", erro),
  );
}

// Menu e formulários independem do movimento: ligam antes e mesmo se o core falhar.
for (const [nome, ligar] of [
  ["menu", iniciarMenu],
  ["formulários", iniciarFormularios],
  ["formulário de proposta", iniciarFormulariosProposta],
]) {
  try {
    ligar();
  } catch (erro) {
    console.error(`[app] ${nome} não ligou.`, erro);
  }
}

// O host do Artifact embrulha a página: se o <html> dele já tiver class, a "sem-js" do
// nosso se perde e o script inline não acha o que trocar. Garante "js" aqui também.
document.documentElement.classList.remove("sem-js");
document.documentElement.classList.add("js");

try {
  iniciar();
} catch (erro) {
  console.error("[app] falha no core; a página segue legível sem movimento.", erro);
  document.documentElement.classList.add("motion");
}
