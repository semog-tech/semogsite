/* Cenas da home, na ordem de src/paginas.json (id "home"). */
import cenaAbertura from "../scenes/01-abertura.js";
import cenaCondominios from "../scenes/02-condominios.js";
import cenaPilares from "../scenes/03-pilares.js";
import cenaTecnologia from "../scenes/04-tecnologia.js";
import cenaRanking from "../scenes/05-ranking.js";
import cenaUnidades from "../scenes/06-unidades.js";
import cenaComunidade from "../scenes/07-comunidade.js";
import cenaProposta from "../scenes/08-proposta.js";

/** @type {import("../core/tipos.js").ListaCenas} */
export const CENAS = [
  ["abertura", cenaAbertura],
  ["condominios", cenaCondominios],
  ["pilares", cenaPilares],
  ["tecnologia", cenaTecnologia],
  ["ranking", cenaRanking],
  ["unidades", cenaUnidades],
  ["comunidade", cenaComunidade],
  ["proposta", cenaProposta],
];
