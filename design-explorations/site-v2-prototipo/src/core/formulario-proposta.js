/* Formulário de proposta em duas etapas (form[data-formulario-proposta]); usado na
   abertura e reaproveitável na cena 08. Sem JS, é um formulário simples de uma etapa
   (as duas etapas visíveis, validação nativa). Com JS:
   - etapa 1 (o mínimo para não perder o lead): condomínio, estado, telefone, e-mail;
   - "Continuar" valida, avisa com honestidade que é demonstração, e a etapa 2 entra no
     lugar da 1 por uma cortina reta (a mesma linguagem das fotos); "Voltar" desfaz;
   - "Pedir proposta" valida a etapa 2 e diz que nada foi enviado.
   Não há backend no protótipo: nenhuma mensagem finge sucesso.

   Contrato de marcação (ids prefixados por instância; ver sections/01-abertura.html):
     form.formulario-proposta[data-formulario-proposta]
       .fp-etapas > .fp-etapa[data-etapa="1"] e .fp-etapa[data-etapa="2"]
       campo: .fp-campo > label + .fp-controle > input|select  + p.fp-erro[id]
       grupo: fieldset.fp-grupo > legend + .fp-opcoes + p.fp-erro[id]
       [data-acao="voltar"], .fp-indicador, p[data-status]
     .fp-so-js some sem JS; o botão "Continuar" é .fp-so-js.
   ?perfil=<valor> na URL (ex.: ?perfil=construtora) deixa a opção marcada na etapa 2; valor
   que não é opção do grupo é ignorado. */
// gsap direto (o mesmo objeto que o core usa) e só o trecho "proposta" do conteúdo: o pacote
// das landings leva o formulário sem arrastar Lenis, ScrollTrigger, SplitText e o JSON inteiro.
import { gsap } from "gsap";
import { proposta } from "../conteudo.json";

const DEMO_ETAPA_1 = "Demonstração: no site, estes dados já ficam salvos aqui.";

const MENSAGENS = {
  condominio: "Informe o nome do condomínio.",
  uf: "Selecione o estado.",
  telefoneVazio: "Informe o telefone com DDD.",
  telefoneIncompleto: "Telefone incompleto: DDD e número, como (81) 99999-9999.",
  telefoneDdd: "Confira o DDD: são dois dígitos, como 81.",
  email: "Confira o e-mail: falta algo como nome@provedor.com.br.",
  nome: "Informe seu nome.",
  perfil: "Escolha uma opção.",
  cliente: "Responda sim ou não.",
};

export function iniciarFormulariosProposta() {
  for (const form of document.querySelectorAll("form[data-formulario-proposta]")) {
    try {
      montar(/** @type {HTMLFormElement} */ (form));
    } catch (erro) {
      console.error("[formulário de proposta] não montou; segue como formulário simples.", erro);
    }
  }
}

/* ---- Telefone ------------------------------------------------------------------- */

/** "81999998888" → "(81) 99999-8888"; aceita parcial. @param {string} d só dígitos */
export function formatarTelefone(d) {
  if (!d) return "";
  if (d.length <= 2) return `(${d}`;
  const ddd = d.slice(0, 2);
  const resto = d.slice(2);
  if (resto.length <= 4) return `(${ddd}) ${resto}`;
  const corte = resto.length === 9 ? 5 : 4;
  return `(${ddd}) ${resto.slice(0, corte)}-${resto.slice(corte)}`;
}

/** DDD de 2 dígitos (sem zero na frente) + 8 ou 9 dígitos. @returns {string} erro ou "" */
export function erroTelefone(d) {
  if (!d) return MENSAGENS.telefoneVazio;
  if (d.length < 10) return MENSAGENS.telefoneIncompleto;
  if (d[0] === "0") return MENSAGENS.telefoneDdd;
  return "";
}

/** Máscara (00) 00000-0000. Apagar sobre um separador apaga o dígito anterior. */
function ligarMascaraTelefone(input) {
  let anterior = "";
  input.addEventListener("input", (evento) => {
    let d = input.value.replace(/\D/g, "").slice(0, 11);
    const apagando = evento instanceof InputEvent && evento.inputType.startsWith("delete");
    if (apagando && d === anterior) d = d.slice(0, -1);
    anterior = d;
    input.value = formatarTelefone(d);
  });
}

/* ---- Validação ------------------------------------------------------------------ */

/** @param {HTMLElement} alvo campo ou fieldset @param {string} mensagem "" limpa */
function marcarErro(alvo, mensagem) {
  const id = alvo
    .getAttribute("aria-describedby")
    ?.split(" ")
    .find((i) => i.endsWith("-erro"));
  const saida = id ? document.getElementById(id) : null;
  if (!saida) throw new Error(`Campo sem p.fp-erro ligado por aria-describedby: ${alvo.id}`);
  saida.textContent = mensagem;
  if (mensagem) alvo.setAttribute("aria-invalid", "true");
  else alvo.removeAttribute("aria-invalid");
}

/** @param {HTMLFormElement} form @returns {Array<[HTMLElement, string]>} */
function errosEtapa1(form) {
  const el = form.elements;
  const d = el.namedItem("telefone").value.replace(/\D/g, "");
  const email = el.namedItem("email");
  return [
    [
      el.namedItem("condominio"),
      el.namedItem("condominio").value.trim() ? "" : MENSAGENS.condominio,
    ],
    [el.namedItem("uf"), el.namedItem("uf").value ? "" : MENSAGENS.uf],
    [el.namedItem("telefone"), erroTelefone(d)],
    [email, !email.value.trim() || email.checkValidity() ? "" : MENSAGENS.email],
  ];
}

/** @param {HTMLFormElement} form @returns {Array<[HTMLElement, string]>} */
function errosEtapa2(form) {
  const el = form.elements;
  const grupo = (nome) => form.querySelector(`fieldset[data-grupo="${nome}"]`);
  return [
    [el.namedItem("nome"), el.namedItem("nome").value.trim() ? "" : MENSAGENS.nome],
    [grupo("perfil"), el.namedItem("perfil").value ? "" : MENSAGENS.perfil],
    [grupo("cliente"), el.namedItem("cliente").value ? "" : MENSAGENS.cliente],
  ];
}

/** Escreve os erros; foca o primeiro. @returns {boolean} válido */
function aplicarErros(erros) {
  for (const [alvo, mensagem] of erros) marcarErro(alvo, mensagem);
  const primeiro = erros.find(([, mensagem]) => mensagem)?.[0];
  if (!primeiro) return true;
  const focavel = primeiro.matches("fieldset") ? primeiro.querySelector("input") : primeiro;
  focavel?.focus();
  return false;
}

/** Ao corrigir, o erro do campo some (o de telefone só some quando o número fecha). */
function limparAoCorrigir(form) {
  const limpar = (evento) => {
    const alvo = evento.target;
    if (!(alvo instanceof HTMLInputElement || alvo instanceof HTMLSelectElement)) return;
    const grupo = alvo.closest("fieldset[aria-invalid]");
    if (grupo instanceof HTMLElement) marcarErro(grupo, "");
    if (!alvo.hasAttribute("aria-invalid")) return;
    const telefoneAberto = alvo.name === "telefone" && erroTelefone(alvo.value.replace(/\D/g, ""));
    if (!telefoneAberto) marcarErro(alvo, "");
  };
  form.addEventListener("input", limpar);
  form.addEventListener("change", limpar);
}

/** Marca o perfil vindo da URL, se for uma das opções do grupo. @param {HTMLFormElement} form */
function marcarPerfilDaUrl(form) {
  const perfil = new URLSearchParams(location.search).get("perfil");
  if (!perfil) return;
  const opcao = Array.from(form.querySelectorAll('input[name="perfil"]')).find(
    (input) => input instanceof HTMLInputElement && input.value === perfil,
  );
  if (opcao instanceof HTMLInputElement) opcao.checked = true;
}

/* ---- Etapas --------------------------------------------------------------------- */

/**
 * Uma cortina reta: a borda que apaga a etapa que sai é a mesma que revela a que entra.
 * Avançar varre da direita para a esquerda; voltar, ao contrário.
 */
function trocarEtapa(form, de, para, avancar) {
  const fechada = avancar ? "inset(0% 100% 0% 0%)" : "inset(0% 0% 0% 100%)";
  const entrando = avancar ? "inset(0% 0% 0% 100%)" : "inset(0% 100% 0% 0%)";
  form.dataset.transicao = "";
  para.inert = false;
  de.inert = true;
  return gsap
    .timeline({
      defaults: { duration: 1.2, ease: "expo.inOut" },
      onComplete: () => {
        delete form.dataset.transicao;
        gsap.set([de, para], { clearProps: "clipPath" });
      },
    })
    .fromTo(de, { clipPath: "inset(0% 0% 0% 0%)" }, { clipPath: fechada }, 0)
    .fromTo(para, { clipPath: entrando }, { clipPath: "inset(0% 0% 0% 0%)" }, 0)
    .from(
      para.children,
      { x: avancar ? 34 : -34, duration: 1.1, ease: "expo.out", stagger: 0.05 },
      0.35,
    );
}

/** @param {HTMLFormElement} form @param {1 | 2} numero */
function irPara(form, estado, numero) {
  const de = estado.etapas[estado.atual - 1];
  const para = estado.etapas[numero - 1];
  estado.transicao?.progress(1);
  form.dataset.etapaAtiva = String(numero);
  estado.transicao = trocarEtapa(form, de, para, numero > estado.atual);
  estado.atual = numero;
  para.querySelector("input, select")?.focus({ preventScroll: true });
}

/** @param {HTMLFormElement} form */
function montar(form) {
  const etapas = /** @type {HTMLElement[]} */ (Array.from(form.querySelectorAll(".fp-etapa")));
  const status = form.querySelector("[data-status]");
  const telefone = form.elements.namedItem("telefone");
  if (etapas.length !== 2 || !status || !(telefone instanceof HTMLInputElement)) {
    throw new Error("Marcação fora do contrato (2 etapas, [data-status], telefone).");
  }
  const estado = { etapas, atual: 1, transicao: /** @type {gsap.core.Timeline | null} */ (null) };
  form.noValidate = true;
  form.dataset.etapaAtiva = "1";
  etapas[1].inert = true;
  // Escolha única: o grupo se anuncia como tal (o rádio nativo já dá as setas do teclado).
  for (const grupo of form.querySelectorAll("fieldset.fp-grupo"))
    grupo.setAttribute("role", "radiogroup");
  ligarMascaraTelefone(telefone);
  limparAoCorrigir(form);
  marcarPerfilDaUrl(form);
  form.addEventListener("submit", (evento) => {
    evento.preventDefault();
    if (estado.atual === 1) {
      if (!aplicarErros(errosEtapa1(form))) return;
      status.textContent = DEMO_ETAPA_1;
      irPara(form, estado, 2);
    } else if (aplicarErros(errosEtapa2(form))) status.textContent = proposta.demo;
  });
  form.querySelector('[data-acao="voltar"]')?.addEventListener("click", () => {
    status.textContent = "";
    irPara(form, estado, 1);
  });
}
