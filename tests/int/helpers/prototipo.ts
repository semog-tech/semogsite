import { readFileSync } from 'node:fs'
import path from 'node:path'

/**
 * Paridade com o protótipo (DP2 do plano da fase 4): a seção que o Next renderiza precisa ter as
 * mesmas classes, ids e atributos `data-*` da parcial HTML do protótipo, cada classe (e cada
 * etiqueta de bloco: parágrafo, item de lista, título, imagem) na mesma quantidade e na mesma
 * ordem de documento. Texto e atributos de valor não entram (o texto mudou de propósito com as
 * respostas do Leandro); quem confere o visual são os quadros no navegador.
 */
const SECOES = path.join(
  process.cwd(),
  'design-explorations',
  'site-v2-prototipo',
  'src',
  'sections',
)

export type Assinatura = { classes: string[]; ids: string[]; dados: string[] }
export type Resultado = {
  faltam: Assinatura
  sobram: Assinatura
  /** Classe ou etiqueta comum aos dois lados com quantidade diferente: `"x: N no protótipo, M aqui"`. */
  contagem: string[]
  /** Onde a sequência das classes e etiquetas comuns diverge pela primeira vez; `null` = mesma ordem. */
  ordem: string | null
}
export type Diferencas = {
  /** Seletores cujas subárvores saem dos dois lados (ex.: o formulário, componente da fase 2). */
  ignorar?: readonly string[]
  semClasses?: readonly string[]
  comClasses?: readonly string[]
  semIds?: readonly string[]
  comIds?: readonly string[]
  semDados?: readonly string[]
  comDados?: readonly string[]
  /**
   * Classes (`'x'`) ou etiquetas (`'<p>'`) cuja quantidade muda de propósito (uma lista do
   * conteúdo que ficou de outro tamanho por resposta do Leandro). Cada uma leva o motivo num
   * comentário na tarefa; sem motivo, a diferença é perda na porta e se corrige a porta.
   */
  contagemLivre?: readonly string[]
}

const VAZIA: Assinatura = { classes: [], ids: [], dados: [] }
export const SEM_DIFERENCA: Resultado = { faltam: VAZIA, sobram: VAZIA, contagem: [], ordem: null }

/** Etiquetas de bloco que contam e ordenam junto com as classes (um parágrafo ou item perdido). */
const ETIQUETAS_CONTADAS = new Set(['p', 'li', 'h1', 'h2', 'h3', 'h4', 'dt', 'dd', 'figure', 'img'])

/** As classes de cada elemento (em ordem alfabética dentro dele) e a etiqueta, se contada, em ordem de documento. */
function marcasEmOrdem(raiz: Element): string[] {
  return [raiz, ...Array.from(raiz.querySelectorAll('*'))].flatMap((el) => {
    const etiqueta = el.tagName.toLowerCase()
    const classes = Array.from(el.classList).sort()
    return ETIQUETAS_CONTADAS.has(etiqueta) ? [`<${etiqueta}>`, ...classes] : classes
  })
}

function contar(marcas: readonly string[]): Map<string, number> {
  const contagem = new Map<string, number>()
  for (const marca of marcas) contagem.set(marca, (contagem.get(marca) ?? 0) + 1)
  return contagem
}

/**
 * Quantidade e ordem (R2: mesmos elementos, na mesma ordem). O conjunto de classes não vê um item
 * perdido de lista nem dois blocos trocados de lugar; a contagem de cada marca comum e a sequência
 * delas veem. Marca declarada em `semClasses`, `comClasses` ou `contagemLivre` fica de fora.
 */
function contagemEOrdem(
  nossa: Element,
  dele: Element,
  declaradas: Diferencas,
): Pick<Resultado, 'contagem' | 'ordem'> {
  const fora = new Set([
    ...(declaradas.semClasses ?? []),
    ...(declaradas.comClasses ?? []),
    ...(declaradas.contagemLivre ?? []),
  ])
  const marcasNossas = marcasEmOrdem(nossa)
  const marcasDele = marcasEmOrdem(dele)
  const quantasNossas = contar(marcasNossas)
  const quantasDele = contar(marcasDele)
  const comuns = [...quantasDele.keys()].filter((m) => quantasNossas.has(m) && !fora.has(m)).sort()
  const contagem = comuns
    .filter((m) => quantasNossas.get(m) !== quantasDele.get(m))
    .map((m) => `${m}: ${quantasDele.get(m)} no protótipo, ${quantasNossas.get(m)} aqui`)
  const ordenaveis = new Set(comuns.filter((m) => quantasNossas.get(m) === quantasDele.get(m)))
  const sequenciaDele = marcasDele.filter((m) => ordenaveis.has(m))
  const sequenciaNossa = marcasNossas.filter((m) => ordenaveis.has(m))
  const i = sequenciaDele.findIndex((m, k) => m !== sequenciaNossa[k])
  const ordem =
    i === -1
      ? null
      : `posição ${i}: "${sequenciaDele[i]}" no protótipo, "${sequenciaNossa[i]}" aqui, depois de "${sequenciaDele.slice(Math.max(0, i - 3), i).join(' ')}"`
  return { contagem, ordem }
}

/** A `<section>` de uma parcial do protótipo, sem comentários e sem as marcas de laço. */
export function secaoDoPrototipo(arquivo: string): Element {
  const html = readFileSync(path.join(SECOES, `${arquivo}.html`), 'utf8')
    .replace(/\r\n?/g, '\n')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/\{\{[#/][^}]*\}\}/g, '')
  const documento = new DOMParser().parseFromString(
    `<!doctype html><body>${html}</body>`,
    'text/html',
  )
  const secao = documento.body.querySelector('section')
  if (!secao) throw new Error(`[protótipo] ${arquivo}.html sem <section>.`)
  return secao
}

function semIgnorados(raiz: Element, ignorar: readonly string[]): Element {
  const copia = raiz.cloneNode(true)
  if (!(copia instanceof Element)) throw new Error('[protótipo] a cópia não é um elemento.')
  for (const seletor of ignorar) {
    for (const el of Array.from(copia.querySelectorAll(seletor))) el.remove()
  }
  return copia
}

export function assinatura(raiz: Element): Assinatura {
  const classes = new Set<string>()
  const ids = new Set<string>()
  const dados = new Set<string>()
  for (const el of [raiz, ...Array.from(raiz.querySelectorAll('*'))]) {
    for (const classe of Array.from(el.classList)) classes.add(classe)
    if (el.id && !el.id.includes('{{')) ids.add(el.id)
    for (const { name } of Array.from(el.attributes)) {
      if (name.startsWith('data-')) dados.add(name)
    }
  }
  const ordenar = (conjunto: Set<string>) => [...conjunto].sort()
  return { classes: ordenar(classes), ids: ordenar(ids), dados: ordenar(dados) }
}

/** O que falta ou sobra na seção renderizada, menos o que a tarefa declarou. */
export function diferencasNaoDeclaradas(
  renderizada: Element,
  prototipo: Element,
  declaradas: Diferencas = {},
): Resultado {
  const ignorar = declaradas.ignorar ?? []
  const renderizadaSemIgnorados = semIgnorados(renderizada, ignorar)
  const prototipoSemIgnorados = semIgnorados(prototipo, ignorar)
  const nossa = assinatura(renderizadaSemIgnorados)
  const dele = assinatura(prototipoSemIgnorados)
  const menos = (de: string[], tirar: string[], aceitos: readonly string[] = []) =>
    de.filter((valor) => !tirar.includes(valor) && !aceitos.includes(valor))
  return {
    ...contagemEOrdem(renderizadaSemIgnorados, prototipoSemIgnorados, declaradas),
    faltam: {
      classes: menos(dele.classes, nossa.classes, declaradas.semClasses),
      ids: menos(dele.ids, nossa.ids, declaradas.semIds),
      dados: menos(dele.dados, nossa.dados, declaradas.semDados),
    },
    sobram: {
      classes: menos(nossa.classes, dele.classes, declaradas.comClasses),
      ids: menos(nossa.ids, dele.ids, declaradas.comIds),
      dados: menos(nossa.dados, dele.dados, declaradas.comDados),
    },
  }
}
