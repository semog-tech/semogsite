import type { Reportar } from '@/site/core/ganchos'

/*
 * O JS das páginas de leitura (leitura.js do protótipo). Leitura não tem pin nem rolagem
 * sequestrada: rolagem nativa, sem Lenis nem GSAP. A entrada do título é animação de CSS
 * (leitura.css). Nada aqui roda no topo do módulo: o Next avalia este arquivo no servidor.
 */

const ROLAGEM_PARA_FUNDO = 8
const LINHA_DE_LEITURA = 0.25
const ESPERA_DAS_FOTOS_MS = 2000

function aoRolarNativo(atualizar: () => void): () => void {
  window.addEventListener('scroll', atualizar, { passive: true })
  window.addEventListener('resize', atualizar, { passive: true })
  atualizar()
  return () => {
    window.removeEventListener('scroll', atualizar)
    window.removeEventListener('resize', atualizar)
  }
}

/** Altura do cabeçalho fixo, lida do token `--cab`. */
export function alturaDoCabecalho(): number {
  const valor = Number.parseFloat(
    getComputedStyle(document.documentElement).getPropertyValue('--cab'),
  )
  return Number.isFinite(valor) ? valor : 0
}

/** Fração lida do corpo: 0 com o início dele sob o cabeçalho, 1 com o fim no pé da tela. */
export function fracaoLida(
  corpo: { top: number; height: number },
  alturaDaJanela: number,
  cab: number,
): number {
  const percurso = corpo.height - (alturaDaJanela - cab)
  const lido = percurso > 0 ? (cab - corpo.top) / percurso : corpo.top < cab ? 1 : 0
  return Math.min(1, Math.max(0, lido))
}

/** O cabeçalho ganha fundo depois do primeiro respiro de rolagem (base.css, `data-rolou`). */
export function iniciarFundoDoCabecalho(): () => void {
  const cabecalho = document.querySelector('[data-cabecalho]')
  if (!(cabecalho instanceof HTMLElement)) {
    throw new Error('[leitura] Cabeçalho [data-cabecalho] ausente.')
  }
  return aoRolarNativo(() =>
    cabecalho.toggleAttribute('data-rolou', window.scrollY > ROLAGEM_PARA_FUNDO),
  )
}

/** A barra de 2 px sob o cabeçalho acompanha o corpo do texto. */
export function iniciarProgresso(): () => void {
  const barra = document.querySelector('[data-progresso]')
  const corpo = document.querySelector('[data-corpo-leitura]')
  if (!barra && !corpo) return () => {} // índice do blog: não há texto corrido
  if (!(barra instanceof HTMLElement) || !(corpo instanceof HTMLElement)) {
    throw new Error('[leitura] Barra [data-progresso] sem [data-corpo-leitura], ou o inverso.')
  }
  const cab = alturaDoCabecalho()
  return aoRolarNativo(() => {
    const fracao = fracaoLida(corpo.getBoundingClientRect(), window.innerHeight, cab)
    barra.style.transform = `scaleX(${fracao})`
  })
}

/** O link do índice cujo título já passou da linha de leitura recebe `aria-current`. */
export function iniciarIndice(reportar: Reportar): () => void {
  const links = Array.from(
    document.querySelectorAll<HTMLAnchorElement>("[data-indice] a[href^='#']"),
  )
  if (links.length === 0) return () => {}
  const pares = links.flatMap((link) => {
    const id = (link.getAttribute('href') ?? '').slice(1)
    const alvo = document.getElementById(id)
    if (!alvo) reportar(new Error(`[leitura] Índice aponta para #${id}, que não existe.`), 'índice')
    return alvo ? [{ link, alvo }] : []
  })
  return aoRolarNativo(() => {
    const linha = alturaDoCabecalho() + window.innerHeight * LINHA_DE_LEITURA
    let atual: HTMLAnchorElement | null = null
    for (const par of pares) if (par.alvo.getBoundingClientRect().top <= linha) atual = par.link
    for (const { link } of pares) {
      if (link === atual) link.setAttribute('aria-current', 'location')
      else link.removeAttribute('aria-current')
    }
  })
}

/**
 * Foto com `loading="lazy"` fora da tela sai como caixa vazia na impressão. Passa a eager depois
 * da carga (sem disputar banda com a primeira dobra) e de novo antes de imprimir.
 */
export function iniciarFotosDaImpressao(): () => void {
  const carregar = () => {
    for (const foto of document.querySelectorAll('img[loading="lazy"]')) {
      foto.setAttribute('loading', 'eager')
    }
  }
  let espera: number | undefined
  const agendar = () => {
    espera = window.setTimeout(carregar, ESPERA_DAS_FOTOS_MS)
  }
  if (document.readyState === 'complete') agendar()
  else window.addEventListener('load', agendar, { once: true })
  window.addEventListener('beforeprint', carregar)
  return () => {
    window.clearTimeout(espera)
    window.removeEventListener('load', agendar)
    window.removeEventListener('beforeprint', carregar)
  }
}

/**
 * Liga tudo, cada peça isolada: a que falha é reportada e as outras seguem. Nada espera
 * movimento na leitura, então as entradas (`.entrada`, base.css) são liberadas já, em vez de
 * esperar os 6 s da rede de segurança do layout (site).
 */
export function ligarLeitura(reportar: Reportar): () => void {
  const pecas: ReadonlyArray<readonly [string, () => () => void]> = [
    ['cabeçalho', iniciarFundoDoCabecalho],
    ['progresso de leitura', iniciarProgresso],
    ['índice', () => iniciarIndice(reportar)],
    ['fotos da impressão', iniciarFotosDaImpressao],
  ]
  const desligamentos = pecas.flatMap(([origem, ligar]) => {
    try {
      return [ligar()]
    } catch (erro) {
      reportar(erro, origem)
      return []
    }
  })
  document.documentElement.classList.remove('sem-js')
  document.documentElement.classList.add('js', 'motion')
  return () => {
    for (const desligar of desligamentos) desligar()
  }
}
