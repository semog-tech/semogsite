/* Cenas de "Tecnologia" (Semog One), na ordem de src/paginas.json (id "tecnologia"). O
   fechamento é a cena 08 da home: o mesmo pedido de proposta em duas etapas. */
import cenaAbertura from "../scenes/tecnologia/01-abertura.js";
import cenaMes from "../scenes/tecnologia/02-mes.js";
import cenaEvolucao from "../scenes/tecnologia/03-evolucao.js";
import cenaConferencia from "../scenes/tecnologia/04-conferencia.js";
import cenaProposta from "../scenes/08-proposta.js";

/** @type {import("../core/tipos.js").ListaCenas} */
export const CENAS = [
  ["semog-one", cenaAbertura],
  ["mes", cenaMes],
  ["evolucao", cenaEvolucao],
  ["conferencia", cenaConferencia],
  ["proposta", cenaProposta],
];
