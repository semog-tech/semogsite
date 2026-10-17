import './comunidade.css'
import type { ReactNode } from 'react'
import { conteudo, type VideoDoExperience } from '@/site/conteudo/conteudo'
import { estaPendente, type OuPendente } from '@/site/conteudo/pendencias'
import { caminhoNoSite } from '@/site/rotas'
import { Pendencia } from '@/site/secoes/comum/Pendencia'
import { VideoQuandoPerto } from './VideoQuandoPerto'

type Foto = (typeof conteudo.comunidade.experience.fotos)[number]

function Seta() {
  return (
    <svg className="seta" aria-hidden="true">
      <use href="#seta" />
    </svg>
  )
}

function Linha({ children, classe }: { children: ReactNode; classe?: string }) {
  return (
    <span className="linha">
      <span className={classe ? `linha-interna ${classe}` : 'linha-interna'}>{children}</span>
    </span>
  )
}

function Retrato({ children }: { children: ReactNode }) {
  return (
    <div className="comunidade-quadro comunidade-quadro--retrato">
      <div className="moldura">
        <span className="comunidade-sombra" aria-hidden="true" />
        {children}
      </div>
    </div>
  )
}

function FotoDoRetrato({ foto }: { foto: Foto }) {
  return (
    // biome-ignore lint/performance/noImgElement: a cena anima moldura e parallax no próprio <img> (abrirFoto), e /site-v2 fica fora do localPatterns do next/image
    <img src={foto.src} alt={foto.alt} width={406} height={720} loading="lazy" />
  )
}

/** Abertura: as folhas de gelo se afastam da linha e revelam a noite; sem JS, já estão abertas. */
function Abertura() {
  const { comunidade } = conteudo
  return (
    <header className="comunidade-abertura">
      <div className="comunidade-aurora" aria-hidden="true" />
      <div className="comunidade-folha comunidade-folha--esq" aria-hidden="true" />
      <div className="comunidade-folha comunidade-folha--dir" aria-hidden="true" />
      <span className="comunidade-fio comunidade-fio--escuro" aria-hidden="true" />
      <span className="comunidade-fio comunidade-fio--luz" aria-hidden="true" />
      <div className="comunidade-abertura-texto">
        <div className="comunidade-chamada">
          <h2 id="comunidade-titulo" className="titulo-display">
            {comunidade.titulo}
          </h2>
          {/* TEXTO-NOVO */}
          <p className="lead">
            Encontros gratuitos que a Semog organiza para quem vive o condomínio.
          </p>
        </div>
        {/* TEXTO-NOVO: cidades e datas (fatos do briefing) */}
        <ul className="comunidade-agenda">
          <li className="comunidade-agenda-item">
            <span className="comunidade-marca" aria-hidden="true" />
            <Linha classe="rotulo">Belém</Linha>
            <Linha classe="comunidade-agenda-nome">{comunidade.cafe.titulo}</Linha>
            <Linha classe="num">4ª edição em 27/09/2026</Linha>
          </li>
          <li className="comunidade-agenda-item">
            <span className="comunidade-marca" aria-hidden="true" />
            <Linha classe="rotulo">João Pessoa</Linha>
            <Linha classe="comunidade-agenda-nome">{comunidade.experience.titulo}</Linha>
            <Linha classe="num">Edição 26 em 26/09/2026</Linha>
          </li>
        </ul>
      </div>
    </header>
  )
}

function Cafe() {
  const { cafe } = conteudo.comunidade
  return (
    <article className="comunidade-cafe" aria-labelledby="comunidade-cafe-titulo">
      <figure className="comunidade-quadro comunidade-quadro--cafe">
        <div className="moldura">
          <span className="comunidade-sombra" aria-hidden="true" />
          {/* biome-ignore lint/performance/noImgElement: a cena anima moldura e parallax no próprio <img> (abrirFoto), e /site-v2 fica fora do localPatterns do next/image */}
          <img src={cafe.foto} alt={cafe.alt} width={1179} height={870} loading="lazy" />
        </div>
        <figcaption className="rotulo">{cafe.legenda}</figcaption>
      </figure>

      <div className="comunidade-par">
        <figure className="comunidade-mote">
          <span className="comunidade-aspas" aria-hidden="true">
            “
          </span>
          <blockquote>
            <p className="comunidade-frase">{cafe.mote}</p>
          </blockquote>
        </figure>
        <div className="comunidade-texto">
          <h3 id="comunidade-cafe-titulo">{cafe.titulo}</h3>
          <p className="comunidade-corpo">{cafe.texto}</p>
          {/* TEXTO-NOVO: rótulos e frases dos marcos (fatos do briefing; substituem comunidade.cafe.edicao) */}
          <dl className="comunidade-marcos">
            <div className="comunidade-marco">
              <dt className="rotulo">
                <Linha>4ª edição</Linha>
              </dt>
              <dd className="comunidade-data num">
                <Linha>27/09/2026</Linha>
              </dd>
              <dd className="comunidade-nota">A bordo, pela Prainha e Estação das Docas.</dd>
            </div>
            <div className="comunidade-marco">
              <dt className="rotulo">
                <Linha>{cafe.proximos.rotulo}</Linha>
              </dt>
              <dd className="comunidade-data">
                <Linha>{cafe.proximos.texto}</Linha>
              </dd>
            </div>
          </dl>
          {/* TEXTO-NOVO: comentário autorizado pelo Leandro (16/10/2026) */}
          <figure className="comunidade-voz">
            <blockquote>
              <p>“Esse dia 27/09/2026 ficará marcado na vida de todos nós.”</p>
            </blockquote>
            <figcaption className="rotulo">
              Ana Cláudia, sobre a 4ª edição, em comentário no Instagram do evento.
            </figcaption>
          </figure>
        </div>
      </div>
    </article>
  )
}

/** Os dois retratos: o reel do 26 no primeiro quando o arquivo existe (DP12), a foto de 2025 até lá. */
function Dupla() {
  const { experience } = conteudo.comunidade
  const [primeira, segunda] = experience.fotos
  // Tipo declarado: vale também enquanto o vídeo for pendência (a foto e o selo voltam).
  const video: OuPendente<VideoDoExperience> = experience.video26
  return (
    <figure className="comunidade-dupla">
      <Retrato>
        {estaPendente(video) ? (
          <FotoDoRetrato foto={primeira} />
        ) : (
          <VideoQuandoPerto video={video} />
        )}
      </Retrato>
      <Retrato>
        <FotoDoRetrato foto={segunda} />
      </Retrato>
      <figcaption className="rotulo">
        {estaPendente(video) ? (
          <>
            {experience.legenda} <Pendencia item={video} />
          </>
        ) : (
          experience.legendaCom26
        )}
      </figcaption>
    </figure>
  )
}

function Experience() {
  const { experience } = conteudo.comunidade
  return (
    <article className="comunidade-experience" aria-labelledby="comunidade-experience-titulo">
      <div className="comunidade-par comunidade-par--inverso">
        <div className="comunidade-texto">
          <h3 id="comunidade-experience-titulo">{experience.titulo}</h3>
          <p className="comunidade-corpo">{experience.texto}</p>
          {/* TEXTO-NOVO: rótulos e frases dos marcos (fatos do briefing; substituem comunidade.experience.edicao) */}
          <dl className="comunidade-marcos comunidade-marcos--menor">
            <div className="comunidade-marco">
              <dt className="rotulo">
                <Linha>Edição 26</Linha>
              </dt>
              <dd className="comunidade-data num">
                <Linha>26/09/2026</Linha>
              </dd>
              <dd className="comunidade-nota">Pilates, yoga e funcional.</dd>
            </div>
            <div className="comunidade-marco">
              <dt className="rotulo">
                <Linha>Em 2025</Linha>
              </dt>
              <dd className="comunidade-data">
                <Linha>Beach tennis</Linha>
              </dd>
              <dd className="comunidade-nota">Foi um campeonato.</dd>
            </div>
          </dl>
          {/* TEXTO-NOVO: rótulo do link */}
          <a className="link-seta" href="https://www.semog.com.br/experience">
            <span>Conhecer o Semog Experience</span> <Seta />
          </a>
        </div>
        <Dupla />
      </div>
    </article>
  )
}

/**
 * Comunidade (home), o mundo escuro da página: uma linha se desenha no gelo, as folhas se abrem
 * para a noite e a mesma linha, já luz, liga Café com Condomínio, Semog Experience e o blog. Na
 * saída, as metades claras da proposta sobem e recolhem a noite.
 */
export function Comunidade() {
  const { blog } = conteudo.comunidade
  return (
    <section
      id="comunidade"
      className="cena"
      data-tema="marinho"
      aria-labelledby="comunidade-titulo"
    >
      <div className="comunidade-noite" aria-hidden="true">
        <div className="comunidade-noite-tela">
          <span className="comunidade-brilho comunidade-brilho--a" />
          <span className="comunidade-brilho comunidade-brilho--b" />
        </div>
      </div>

      <Abertura />

      <div className="comunidade-capitulos">
        <svg className="comunidade-percurso" aria-hidden="true">
          <path className="percurso" />
          <rect className="comunidade-ponta" width="6" height="6" />
        </svg>

        <Cafe />
        <Experience />

        <article className="comunidade-blog" aria-labelledby="comunidade-blog-titulo">
          <h3 id="comunidade-blog-titulo">{blog.titulo}</h3>
          <p className="comunidade-corpo">{blog.texto}</p>
          {/* O link fica na prévia (DP3): a URL absoluta do conteúdo tiraria dela quem clica. */}
          <a className="link-seta" href={caminhoNoSite('/blog')}>
            <span>Ler o blog</span> <Seta />
          </a>
        </article>
      </div>

      <div className="comunidade-saida" aria-hidden="true">
        <span className="comunidade-metade comunidade-metade--menor" />
        <span className="comunidade-metade comunidade-metade--maior" />
      </div>
    </section>
  )
}
