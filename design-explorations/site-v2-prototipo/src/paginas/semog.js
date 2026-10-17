/* Cenas de "A Semog", na ordem de src/paginas.json (id "semog"). O fechamento é a cena 08
   da home: o mesmo pedido de proposta em duas etapas. */
import cenaManifesto from "../scenes/semog/01-manifesto.js";
import cenaHistoria from "../scenes/semog/02-historia.js";
import cenaPrincipios from "../scenes/semog/03-principios.js";
import cenaPessoas from "../scenes/semog/04-pessoas.js";
import cenaAssembleia from "../scenes/semog/05-assembleia.js";
import cenaDepoimentos from "../scenes/semog/06-depoimentos.js";
import cenaProposta from "../scenes/08-proposta.js";

/** @type {import("../core/tipos.js").ListaCenas} */
export const CENAS = [
  ["a-semog", cenaManifesto],
  ["historia", cenaHistoria],
  ["principios", cenaPrincipios],
  ["pessoas", cenaPessoas],
  ["depoimentos", cenaDepoimentos],
  ["assembleia", cenaAssembleia],
  ["proposta", cenaProposta],
];
