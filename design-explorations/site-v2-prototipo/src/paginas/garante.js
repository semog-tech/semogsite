/* Cenas de "Semog Garante", na ordem de src/paginas.json (id "garante"). O fechamento é a
   cena 08 da home: o mesmo pedido de proposta em duas etapas. */
import cenaAbertura from "../scenes/garante/01-abertura.js";
import cenaCaixa from "../scenes/garante/02-caixa.js";
import cenaPapeis from "../scenes/garante/03-papeis.js";
import cenaDuvidas from "../scenes/garante/04-duvidas.js";
import cenaProposta from "../scenes/08-proposta.js";

/** @type {import("../core/tipos.js").ListaCenas} */
export const CENAS = [
  ["semog-garante", cenaAbertura],
  ["caixa-do-condominio", cenaCaixa],
  ["papeis", cenaPapeis],
  ["duvidas-garante", cenaDuvidas],
  ["proposta", cenaProposta],
];
