/* Formulários demonstrativos (form[data-demo]): nada é enviado, e a tela diz isso.
   Independe do GSAP. Quando houver envio real, ele entra aqui, com erro tratado na tela. */
// Só o trecho "proposta": o pacote "landing" também liga estes formulários e não leva o
// JSON inteiro.
import { proposta } from "../conteudo.json";

export function iniciarFormularios() {
  for (const form of document.querySelectorAll("form[data-demo]")) {
    form.addEventListener("submit", (evento) => {
      evento.preventDefault();
      const status = form.querySelector("[data-status]");
      if (status) status.textContent = proposta.demo;
      else console.error("[formulário] form[data-demo] sem [data-status].", form);
    });
  }
}
