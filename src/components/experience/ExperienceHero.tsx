import { img } from '@/../content/media'
import { ArrowIcon, CalendarIcon, CheckIcon, LockIcon } from '@/components/experience/icones'
import { ImageMedia } from '@/components/Media/ImageMedia'
import { EXPERIENCE_EVENT as E } from '@/data/experienceEvent'
import type { EstadoDaInscricao } from '@/lib/experienceEstado'

/**
 * Hero da landing — porte do `<header class="hero s-dark">` do protótipo
 * aprovado. Data, horário e local vêm de `EXPERIENCE_EVENT`;
 * a capacidade chega do banco, compartilhada com o app.
 *
 * A foto é o LCP da página: `priority` faz o `next/image` emitir o
 * `<link rel="preload">` no `<head>` em vez de esperar o layout.
 *
 * O logo do topo NÃO é link. No protótipo era `href="#"` (placeholder); numa
 * peça de campanha isolada a única saída da página é a inscrição, então virou
 * imagem — no rodapé ele já é tratado assim.
 *
 * Com a inscrição fechada a dobra não perde o CTA — ela **troca** o CTA. Um
 * botão desativado no topo de uma página só convida ao clique frustrado, e um
 * hero sem ação nenhuma deixa quem já se inscreveu sem caminho até o endereço.
 */

/**
 * O botão do topo. Vira nota quando não há mais o que clicar: `.topbar-nota` é
 * uma pílula sem ação, com a mesma altura do botão que ela substitui, então a
 * barra não muda de forma entre um estado e outro.
 */
function TopbarAcao({ estado }: { estado: EstadoDaInscricao }) {
  if (estado === 'aberto') {
    return (
      <a className="btn btn-primary" href="#inscricao">
        Faça sua inscrição
      </a>
    )
  }
  if (estado === 'esgotado') {
    return (
      <span className="topbar-nota">
        <LockIcon />
        Inscrições encerradas
      </span>
    )
  }
  return (
    <span className="topbar-nota">
      <CheckIcon />
      Edição encerrada
    </span>
  )
}

/**
 * A dupla ação + linha de vagas da dobra.
 *
 * No `encerrado` a ação vira `.btn-off`: o desenho de pílula do `.btn` sem
 * brilho nem destino. Não é `<button disabled>` — não há operação a desabilitar,
 * é um selo com forma de botão. `aria-disabled` diz isso a quem usa leitor de
 * tela sem criar um alvo de teclado que não leva a lugar nenhum.
 */
function HeroAcoes({
  estado,
  capacidade = null,
}: {
  estado: EstadoDaInscricao
  capacidade?: number | null
}) {
  if (estado === 'encerrado') {
    return (
      <div className="hero-actions">
        <span aria-disabled="true" className="btn btn-off">
          <CheckIcon />O evento já aconteceu
        </span>
        {/* O ano sai do ISO de `E.date` — é a mesma fonte da data exibida, e
            escrever "2026" aqui faria a página mentir na virada da edição. */}
        <span className="seats">
          Edição de {E.date.slice(0, 4)}, realizada em {E.city}
        </span>
      </div>
    )
  }

  const esgotado = estado === 'esgotado'
  return (
    <div className="hero-actions">
      <a className={`btn ${esgotado ? 'btn-light' : 'btn-primary'}`} href="#inscricao">
        {esgotado ? 'Ver informações do evento' : 'Garantir minha vaga'}
        <ArrowIcon />
      </a>
      <span className="seats">
        <LockIcon />
        {esgotado ? (
          `As ${capacidade === null ? '' : `${capacidade} `}vagas foram preenchidas`
        ) : (
          <>
            {E.priceLabel} · {capacidade === null ? 'Vagas limitadas' : `${capacidade} vagas`}
          </>
        )}
      </span>
    </div>
  )
}

export function ExperienceHero({
  estado,
  capacidade = null,
}: {
  estado: EstadoDaInscricao
  capacidade?: number | null
}) {
  const hero = img('experience-hero.webp')
  const encerrado = estado === 'encerrado'

  return (
    <header className="hero s-dark">
      <div className="topbar">
        <div className="wrap">
          {/* biome-ignore lint/performance/noImgElement: SVG de /public, sem otimização a fazer (mesmo caso do FooterView) */}
          <img
            alt="Semog Administradora de Condomínios"
            className="logo"
            height={25}
            src="/semog-logo-light.svg"
            width={160}
          />
          <TopbarAcao estado={estado} />
        </div>
      </div>

      <div className="hero-bg">
        <ImageMedia fill priority resource={hero} sizes="100vw" />
      </div>
      <div className="hero-veil" />

      <div className="wrap">
        <div>
          <p className="tag">Movimento. Saúde. Conexão.</p>
          <h1 className="titulo">
            <span className="marca">Semog</span>
            <span className="linha">
              <span className="palavra">Experience</span>
              <span className="ano">{E.edition}</span>
            </span>
          </h1>
        </div>
        {/* Uma palavra separa a promessa da memória: passado o sábado, "Uma
            manhã inteira dedicada" vira "Foi uma manhã inteira dedicada". */}
        <p className="lede">
          {encerrado ? 'Foi uma' : 'Uma'} manhã inteira dedicada a cuidar de quem cuida do
          condomínio. Ao ar livre, à beira-mar, e por nossa conta.
        </p>

        <div className="meta">
          <div className="meta-item">
            <CalendarIcon />
            <div>
              <div className="meta-label">Data</div>
              <div className="meta-value">
                <time dateTime={E.date}>{E.dateLabel}</time>
                <small>{E.weekday}</small>
              </div>
            </div>
          </div>
          <div className="meta-item">
            <svg
              aria-hidden="true"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              viewBox="0 0 24 24"
            >
              <circle cx="12" cy="12" r="9" />
              <path d="M12 7v5l3.5 2" />
            </svg>
            <div>
              <div className="meta-label">Horário</div>
              {/* "chegue 15 min antes" é instrução para quem ainda vai — depois
                  do evento é só ruído numa linha que virou registro. */}
              <div className="meta-value">
                {E.timeLabel}
                {!encerrado && <small>chegue 15 min antes</small>}
              </div>
            </div>
          </div>
          <div className="meta-item">
            <svg
              aria-hidden="true"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              viewBox="0 0 24 24"
            >
              <path d="M12 21s7-5.5 7-11a7 7 0 1 0-14 0c0 5.5 7 11 7 11Z" />
              <circle cx="12" cy="10" r="2.5" />
            </svg>
            <div>
              <div className="meta-label">Local</div>
              {/* Só o nome do local aqui: o ponto de referência é o que orienta
                  na hora de chegar e vive no painel da programação e na
                  confirmação por e-mail, onde a pessoa volta para consultar. */}
              <div className="meta-value">
                {E.venue}
                <small>
                  {E.district} — {E.city}, {E.uf}
                </small>
              </div>
            </div>
          </div>
        </div>

        <HeroAcoes capacidade={capacidade} estado={estado} />
      </div>

      <div className="badge35">
        <div className="num">
          +35
          <small>anos</small>
        </div>
        <p>De história cuidando de pessoas e valorizando lugares</p>
      </div>
    </header>
  )
}
