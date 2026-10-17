/* Cenas de "Incorporadoras", na ordem de src/paginas.json (id "incorporadoras"). O
   fechamento é a cena 08 da home: o mesmo pedido de proposta em duas etapas. */
import cenaAbertura from "../scenes/incorporadoras/01-abertura.js";
import cenaConvivencia from "../scenes/incorporadoras/02-convivencia.js";
import cenaPercurso from "../scenes/incorporadoras/03-percurso.js";
import cenaGanhos from "../scenes/incorporadoras/04-ganhos.js";
import cenaInstalacao from "../scenes/incorporadoras/05-instalacao.js";
import cenaLancamento from "../scenes/incorporadoras/06-lancamento.js";
import cenaProposta from "../scenes/08-proposta.js";

/** @type {import("../core/tipos.js").ListaCenas} */
export const CENAS = [
  ["incorporadoras", cenaAbertura],
  ["convivencia", cenaConvivencia],
  ["percurso", cenaPercurso],
  ["ganhos", cenaGanhos],
  ["instalacao", cenaInstalacao],
  ["lancamento", cenaLancamento],
  ["proposta", cenaProposta],
];
