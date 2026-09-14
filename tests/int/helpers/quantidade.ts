/**
 * Quantidade anunciada num texto de oferta — o padrão ÚNICO das duas travas da
 * água de coco (`experience-data` no dado, `experience-sections` no render).
 * Mora aqui porque as duas precisam da mesma régua: enquanto cada uma tinha a
 * sua, o render ficou com a versão estreita e deixava passar "1 por pessoa".
 *
 * Pega:
 * - qualquer DÍGITO ("100 águas", "1 por pessoa", "2 caixas", "1.000");
 * - numeral cardinal por EXTENSO, de "um" a "novecentos", mais "mil";
 * - os coletivos "dúzia", "dezena" e "centena".
 *
 * NÃO pega — dito na cara, para ninguém confiar mais do que dá:
 * - quantificador vago que também é promessa cobrável no dia: "limitado",
 *   "enquanto durar", "para os primeiros que chegarem", "vários";
 * - fração e medida: "meio litro por pessoa" passa (só "meia dúzia" cai, e
 *   pela dúzia);
 * - numeral em outra língua ou grafia torta ("one", "1O" com letra O).
 *
 * `um`/`uma` entram inteiros, sem exigir contexto: é o que pega "um por
 * pessoa", que é justamente a forma que copy escreve. O preço é o artigo
 * indefinido reprovar junto ("uma manhã") — numa linha de duas frases sobre
 * bebida isso quase não aparece, e quando aparecer a frase se reescreve. A
 * alternativa (exigir "por", "para cada"…) perde para a próxima variante e
 * vira jogo de gato e rato.
 *
 * Numeral composto cai no primeiro termo: "vinte e cinco" pega em `vinte`,
 * "mil e duzentas" em `mil`.
 */
export const QUANTIDADE_ANUNCIADA =
  /\d|\b(um|uma|dois|duas|tr[êe]s|quatro|cinco|seis|sete|oito|nove|dez|onze|doze|treze|quatorze|catorze|quinze|dezesseis|dezessete|dezoito|dezenove|vinte|trinta|quarenta|cinquenta|sessenta|setenta|oitenta|noventa|cem|cento|duzent[oa]s|trezent[oa]s|quatrocent[oa]s|quinhent[oa]s|seiscent[oa]s|setecent[oa]s|oitocent[oa]s|novecent[oa]s|mil|d[úu]zias?|dezenas?|centenas?)\b/i
