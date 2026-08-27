import { EXPERIENCE_EVENT as E } from '@/data/experienceEvent'
import { EXPERIENCE_SPONSORS, type Sponsor } from '@/data/experienceSponsors'

/**
 * Faixa de patrocínio — porte da `<section class="sponsors s-white">` do
 * protótipo aprovado, agora AGRUPADA POR COTA (pedido do cliente, 24/08/2026):
 * antes a única pista da cota era o tamanho do logo, que ninguém lê como
 * hierarquia.
 *
 * O FUNDO CLARO É OBRIGATÓRIO, não é escolha estética: a diretriz de marca da
 * Superlógica define a versão colorida do logo como primária para fundos
 * claros e proíbe aplicá-lo sobre imagem, com sombra, em preto ou em contorno
 * (ver Global Constraints do plano). Daí `.s-white`, `<img>` cru e nenhum
 * filtro.
 *
 * A largura de cada logo continua vindo do dado (`width`): dentro de uma mesma
 * cota ela equilibra o peso óptico entre marcas de proporção diferente, e
 * entre cotas reforça a hierarquia que o rótulo agora declara.
 */

/**
 * Ordem da hierarquia — é também a ordem de exibição, e o que decide quais
 * cotas o convite do rodapé anuncia como disponíveis. Cota sem patrocinador
 * NÃO vira uma coluna vazia na faixa: um "Ouro" em branco numa página pública
 * anuncia que o evento não vendeu, o oposto do que a faixa existe para fazer.
 */
const COTAS: { tier: Sponsor['tier']; label: string }[] = [
  { tier: 'diamante', label: 'Diamante' },
  { tier: 'ouro', label: 'Ouro' },
  { tier: 'prata', label: 'Prata' },
  { tier: 'bronze', label: 'Bronze' },
]

/** 'Ouro e Prata' / 'Ouro, Prata e Bronze' — sem vírgula antes do último. */
function listar(itens: string[]) {
  if (itens.length <= 1) return itens.join('')
  return `${itens.slice(0, -1).join(', ')} e ${itens[itens.length - 1]}`
}

export function ExperienceSponsors() {
  const grupos = COTAS.map((cota) => ({
    ...cota,
    sponsors: EXPERIENCE_SPONSORS.filter((s) => s.tier === cota.tier),
  }))

  const ocupadas = grupos.filter((g) => g.sponsors.length > 0)
  const livres = grupos.filter((g) => g.sponsors.length === 0).map((g) => g.label)

  return (
    <section className="sponsors s-white">
      <div className="wrap">
        <span className="eyebrow">Patrocínio</span>
        <span className="rule" />

        {/*
          `<dl>` e não uma pilha de divs: a relação aqui é termo -> definição
          ("Diamante" é a cota, os logos são quem a ocupa), e é assim que o
          leitor de tela anuncia o par. O `<div>` de agrupamento é válido em
          HTML5 justamente para casar um `dt` com o `dd` dele.
        */}
        <dl className="sponsor-tiers">
          {ocupadas.map((grupo) => (
            <div className="tier" key={grupo.tier}>
              <dt>{grupo.label}</dt>
              <dd>
                {grupo.sponsors.map((sponsor) => (
                  <a
                    className="sponsor"
                    href={sponsor.url}
                    key={sponsor.name}
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    {/* biome-ignore lint/performance/noImgElement: SVG de /public, sem otimização a fazer (mesmo caso do FooterView) */}
                    <img
                      alt={sponsor.name}
                      loading="lazy"
                      src={sponsor.logo}
                      width={sponsor.width}
                    />
                  </a>
                ))}
              </dd>
            </div>
          ))}
        </dl>

        {/*
          As cotas anunciadas saem da AUSÊNCIA de patrocinador, não de uma lista
          escrita à mão: quando a Ouro fechar, basta entrar em
          `EXPERIENCE_SPONSORS` e este convite se corrige sozinho — em vez de
          seguir oferecendo no site uma cota já vendida.
        */}
        <p className="aside">
          {livres.length > 0 ? (
            <>
              Quer apoiar o {E.name}? As cotas <strong>{listar(livres)}</strong> ainda estão
              disponíveis — fale com a gente pelo{' '}
              <a href="mailto:ola@semog.com.br">ola@semog.com.br</a>.
            </>
          ) : (
            <>
              Quer apoiar o {E.name}? Fale com a gente pelo{' '}
              <a href="mailto:ola@semog.com.br">ola@semog.com.br</a>.
            </>
          )}
        </p>
      </div>
    </section>
  )
}
