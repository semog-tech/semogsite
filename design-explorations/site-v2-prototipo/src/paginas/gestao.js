/* Cenas de "Gestão" (administração de condomínios), na ordem de src/paginas.json (id
   "gestao"). O fechamento é a cena 08 da home: o mesmo pedido de proposta em duas etapas. */
import cenaAbertura from "../scenes/gestao/01-abertura.js";
import cenaMesa from "../scenes/gestao/02-mesa.js";
import cenaAtende from "../scenes/gestao/03-atende.js";
import cenaTroca from "../scenes/gestao/04-troca.js";
import cenaPerguntas from "../scenes/gestao/05-perguntas.js";
import cenaProposta from "../scenes/08-proposta.js";

/** @type {import("../core/tipos.js").ListaCenas} */
export const CENAS = [
  ["administracao-de-condominios", cenaAbertura],
  ["mesa-do-sindico", cenaMesa],
  ["quem-atende", cenaAtende],
  ["troca-de-administradora", cenaTroca],
  ["perguntas-gestao", cenaPerguntas],
  ["proposta", cenaProposta],
];
