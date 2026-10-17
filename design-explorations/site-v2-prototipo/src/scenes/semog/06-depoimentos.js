/**
 * A Semog · depoimentos. Sem pin: o título e cada fala sobem linha a linha por máscara
 * quando chegam à tela; a autoria sobe logo depois da fala dela.
 *
 * @param {import("../../core/tipos.js").ContextoCena} ctx
 */
export default function init(ctx) {
  const { root, util } = ctx;
  const titulo = root.querySelector(".dp-titulo");
  if (!(titulo instanceof HTMLElement)) throw new Error("[cena depoimentos] falta .dp-titulo.");
  util.revelarTexto(titulo, { duracao: 1.2 });
  for (const citacao of root.querySelectorAll(".dp-citacao")) {
    const texto = citacao.querySelector(".dp-texto");
    const autoria = citacao.querySelector(".dp-autoria");
    if (!(texto instanceof HTMLElement) || !(autoria instanceof HTMLElement)) {
      throw new Error("[cena depoimentos] citação sem texto ou autoria.");
    }
    util.revelarTexto(texto, { inicio: "top 85%", duracao: 1.1, stagger: 0.07 });
    util.revelarTexto(autoria, { gatilho: texto, inicio: "top 85%", atraso: 0.35 });
  }
}
