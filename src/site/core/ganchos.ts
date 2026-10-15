/**
 * Registro do que precisa ser desfeito quando a página desmonta, e dos ganchos de impressão.
 * O protótipo pressupunha um documento novo por página; no Next o runner desmonta (StrictMode
 * em dev, troca de rota no futuro) e o que não é GSAP (listener, ticker, observer) fica aqui.
 */
export type Reportar = (erro: unknown, origem: string) => void

const ganchosImpressao = new Set<() => void>()
const desligamentos = new Set<() => void>()
/** Enquanto uma cena monta, também guarda aqui o que ela registrou (ver `coletarDesligamentos`). */
let coletor: Array<() => void> | null = null

/** Registra o que deve acontecer antes de imprimir (ex.: escrever o valor final). */
export function aoImprimir(gancho: () => void): () => void {
  ganchosImpressao.add(gancho)
  return () => {
    ganchosImpressao.delete(gancho)
  }
}

/** Uso do core/impressao.ts. Um gancho que falha é reportado (Sentry) e não impede os outros. */
export function executarGanchosImpressao(reportar: Reportar): void {
  for (const gancho of ganchosImpressao) {
    try {
      gancho()
    } catch (erro) {
      reportar(erro, 'impressão')
    }
  }
}

/** Guarda `desligar` para o desmonte e devolve uma versão que roda uma vez só. */
export function registrarDesligamento(desligar: () => void): () => void {
  let feito = false
  const umaVez = () => {
    if (feito) return
    feito = true
    desligamentos.delete(umaVez)
    desligar()
  }
  desligamentos.add(umaVez)
  coletor?.push(umaVez)
  return umaVez
}

/**
 * Roda `executar` e devolve os desligamentos registrados durante ele, para a montagem desligar
 * só os de uma cena que quebrou. Só vê a parte síncrona: o que a cena registra depois de um
 * `await` fica apenas no desmonte geral.
 */
export function coletarDesligamentos(executar: () => void): Array<() => void> {
  const anterior = coletor
  const coletados: Array<() => void> = []
  coletor = coletados
  try {
    executar()
  } finally {
    coletor = anterior
  }
  return coletados
}

/** Desliga tudo o que foi registrado e esquece os ganchos de impressão. Devolve os erros. */
export function desligarTudo(): unknown[] {
  const erros: unknown[] = []
  for (const desligar of [...desligamentos]) {
    try {
      desligar()
    } catch (erro) {
      erros.push(erro)
    }
  }
  desligamentos.clear()
  ganchosImpressao.clear()
  return erros
}
