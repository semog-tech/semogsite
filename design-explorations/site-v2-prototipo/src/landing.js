/* Entrada das landings de cidade (Google Ads) e das páginas leves (proposta, contato, 404).
   Pacote mínimo: o formulário de proposta e gestos pequenos, sem Lenis, ScrollTrigger,
   pins nem as cenas das outras páginas.
   A primeira dobra não depende deste arquivo: título e foto entram por animação de CSS e
   o formulário já está pronto no HTML (sem JS, ele é um formulário de uma etapa).
   - .revelar: abaixo da dobra, cada bloco entra por máscara quando chega à tela;
   - o header ganha a linha de baixo depois do primeiro respiro de rolagem;
   - "Pedir proposta" (header e fechamento) leva ao formulário e põe o foco no 1º campo;
   - nas páginas leves, que têm o header completo: o menu do celular e os formulários
     demonstrativos (form[data-demo]). */
import { iniciarMenu } from "./core/cabecalho.js";
import { iniciarFormularios } from "./core/formularios.js";
import { iniciarFormulariosProposta } from "./core/formulario-proposta.js";

const ROLAGEM_PARA_LINHA = 8;

/** Liga as entradas abaixo da dobra; sem IntersectionObserver, nada fica escondido. */
function revelarAoEntrar() {
  const blocos = document.querySelectorAll(".revelar");
  if (!blocos.length || typeof IntersectionObserver === "undefined") return;
  const observador = new IntersectionObserver(
    (entradas) => {
      for (const entrada of entradas) {
        if (!entrada.isIntersecting) continue;
        entrada.target.classList.add("visivel");
        observador.unobserve(entrada.target);
      }
    },
    { rootMargin: "0px 0px -12% 0px" },
  );
  for (const bloco of blocos) observador.observe(bloco);
  // Só agora o CSS esconde o estado inicial: se este arquivo falhar, tudo segue visível.
  document.documentElement.classList.add("landing-viva");
}

function linhaDoCabecalho() {
  const cabecalho = document.querySelector("[data-cabecalho]");
  if (!(cabecalho instanceof HTMLElement)) {
    console.error("[landing] Header [data-cabecalho] não encontrado.");
    return;
  }
  const atualizar = () =>
    cabecalho.toggleAttribute("data-rolou", window.scrollY > ROLAGEM_PARA_LINHA);
  window.addEventListener("scroll", atualizar, { passive: true });
  atualizar();
}

/**
 * Todo link para #proposta rola até o formulário e foca o primeiro campo da etapa ativa (a
 * outra etapa fica inerte e não recebe foco).
 */
function irAoFormulario() {
  const links = document.querySelectorAll('a[href="#proposta"]');
  if (!links.length) return; // contato e 404: o pedido mora em proposta.html
  const alvo = document.getElementById("proposta");
  if (!alvo) {
    console.error("[landing] #proposta ausente: os links seguem como âncora simples.");
    return;
  }
  for (const link of links) {
    link.addEventListener("click", (evento) => {
      evento.preventDefault();
      alvo.scrollIntoView({ behavior: "smooth", block: "start" });
      const campo = alvo.querySelector(".fp-etapa:not([inert]) :is(input, select)");
      if (campo instanceof HTMLElement) campo.focus({ preventScroll: true });
    });
  }
}

/** O menu só existe no header completo (páginas leves); o enxuto das landings não tem. */
function menuSeHouver() {
  if (document.querySelector("[data-cabecalho] [data-menu]")) iniciarMenu();
}

for (const [nome, ligar] of [
  ["formulário de proposta", iniciarFormulariosProposta],
  ["formulários", iniciarFormularios],
  ["menu", menuSeHouver],
  ["entradas", revelarAoEntrar],
  ["header", linhaDoCabecalho],
  ["atalho do formulário", irAoFormulario],
]) {
  try {
    ligar();
  } catch (erro) {
    console.error(`[landing] ${nome} não ligou.`, erro);
  }
}

// O esqueleto libera os .entrada quando html.motion chega; aqui não há o que esperar.
document.documentElement.classList.remove("sem-js");
document.documentElement.classList.add("js", "motion");
