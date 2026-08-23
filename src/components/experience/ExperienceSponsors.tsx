import { EXPERIENCE_EVENT as E } from '@/data/experienceEvent'
import { EXPERIENCE_SPONSORS } from '@/data/experienceSponsors'

/**
 * Faixa de patrocínio — porte da `<section class="sponsors s-white">` do
 * protótipo aprovado.
 *
 * O FUNDO CLARO É OBRIGATÓRIO, não é escolha estética: a diretriz de marca da
 * Superlógica define a versão colorida do logo como primária para fundos
 * claros e proíbe aplicá-lo sobre imagem, com sombra, em preto ou em contorno
 * (ver Global Constraints do plano). Daí `.s-white`, `<img>` cru e nenhum
 * filtro.
 *
 * A largura de cada logo vem do dado (`width`), que é o que equilibra o peso
 * óptico quando entrar um segundo patrocinador com proporção diferente. O
 * protótipo mostrava a Superlógica a 260px e `EXPERIENCE_SPONSORS` fixou 190 —
 * um número, uma linha de edição, sem tocar em componente.
 */
export function ExperienceSponsors() {
  return (
    <section className="sponsors s-white">
      <div className="wrap">
        <span className="eyebrow">Patrocínio</span>
        <span className="rule" />
        <div className="sponsor-row">
          {EXPERIENCE_SPONSORS.map((sponsor) => (
            <a
              className="sponsor"
              href={sponsor.url}
              key={sponsor.name}
              rel="noopener noreferrer"
              target="_blank"
            >
              {/* biome-ignore lint/performance/noImgElement: SVG de /public, sem otimização a fazer (mesmo caso do FooterView) */}
              <img alt={sponsor.name} loading="lazy" src={sponsor.logo} width={sponsor.width} />
            </a>
          ))}
        </div>
        <p className="aside">
          Quer apoiar o {E.name}? Fale com a gente pelo{' '}
          <a href="mailto:ola@semog.com.br">ola@semog.com.br</a>.
        </p>
      </div>
    </section>
  )
}
