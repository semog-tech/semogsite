import { PropostaForm } from '@/components/forms/PropostaForm'
import type { CityLandingData } from '@/data/cityLandings'
import { Reveal, Stagger } from '@/motion/reveal'

/**
 * Landing de unidade (produção) — premium navy/ice em camadas. Server
 * component: renderiza os leaves-cliente (Reveal/Stagger/PropostaForm). Recebe
 * os dados da cidade (`@/data/cityLandings`); as partes iguais entre cidades
 * (soluções, diferenciais, passos, autoridade G20) vivem aqui. Ver
 * [[city-landing-redesign]] e a análise SEO/Ads.
 */

const ICE = '#add5eb'
const NAVY_950 = '#05081a'
const NAVY_900 = '#0a102e'
const LIGHT = '#eef1f8'
const INK = '#0d1439'
const DISPLAY = 'var(--font-clash), system-ui, sans-serif'

function Icon({ d, size = 26 }: { d: string; size?: number }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke={ICE}
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={{ width: size, height: size }}
    >
      <title>{''}</title>
      <path d={d} />
    </svg>
  )
}

const IC = {
  doc: 'M14 3H7a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V7l-4-4zM14 3v4h4M9 12h6M9 16h6',
  shield: 'M12 3l7 3v5c0 4.2-3 7.4-7 8-4-.6-7-3.8-7-8V6l7-3z',
  coins:
    'M12 6c3.3 0 6 1 6 2.5S15.3 11 12 11 6 10 6 8.5 8.7 6 12 6zM6 8.5v7C6 17 8.7 18 12 18s6-1 6-2.5v-7',
  scale: 'M12 4v16M6 20h12M5 8h14M5 8l-2.5 6a3 3 0 0 0 5 0zM19 8l2.5 6a3 3 0 0 0-5 0z',
  calendar: 'M5 6h14v14H5zM5 10h14M9 4v4M15 4v4',
  phone: 'M8 3h8v18H8zM11 18h2',
  chat: 'M4 5h16v11H9l-4 4V5z',
}

const SOLUCOES: { icon: string; title: string; text: string; span: string; exclusive?: boolean }[] =
  [
    {
      icon: IC.doc,
      title: 'Prestação de contas 100% digital',
      text: 'O balancete que todos os condôminos entendem: documentos anexados, gráficos claros e assinatura com validade jurídica.',
      span: 'lg:col-span-3 lg:row-span-2',
      exclusive: true,
    },
    {
      icon: IC.shield,
      title: 'Semog Garante',
      text: 'Inadimplência zero por 1% da arrecadação. O condomínio recebe 100% da receita prevista. A cobrança vira problema nosso.',
      span: 'lg:col-span-3 lg:row-span-2',
      exclusive: true,
    },
    {
      icon: IC.coins,
      title: 'Gestão financeira e cobrança',
      text: 'Planejamento, controle e previsibilidade mês a mês.',
      span: 'lg:col-span-2',
    },
    {
      icon: IC.scale,
      title: 'Assessoria jurídica',
      text: 'Contratos, convenções e conflitos com time próprio.',
      span: 'lg:col-span-2',
    },
    {
      icon: IC.calendar,
      title: 'Assembleias digitais',
      text: 'Convocação, condução e ata com validade.',
      span: 'lg:col-span-2',
    },
    {
      icon: IC.phone,
      title: 'App para moradores e síndicos',
      text: 'Boletos, reservas e avisos na palma da mão.',
      span: 'lg:col-span-3',
    },
    {
      icon: IC.chat,
      title: 'Atendimento próximo',
      text: 'Aqui, cliente fala com sócio, não com protocolo.',
      span: 'lg:col-span-3',
    },
  ]

const DIFERENCIAIS = [
  {
    icon: IC.doc,
    title: 'Tecnologia própria, com IA',
    text: 'Uma plataforma construída sobre o nosso ERP, que evolui toda semana. O SGC+ usa inteligência artificial na gestão do dia a dia.',
  },
  {
    icon: IC.scale,
    title: 'Transparência de verdade',
    text: 'Prestação de contas 100% digital, aberta a todos os condôminos e com validade jurídica. Nada de balancete confuso.',
  },
  {
    icon: IC.chat,
    title: 'Gente na relação',
    text: 'Equipe local especializada, sempre por perto. Financeiro, jurídico e contábil próprios, à sua disposição.',
  },
]

const STEPS = [
  { n: '01', title: 'Diagnóstico', text: 'Entendemos a realidade e as dores do seu condomínio.' },
  {
    n: '02',
    title: 'Proposta sob medida',
    text: 'Apresentamos a melhor solução para o seu perfil.',
  },
  {
    n: '03',
    title: 'Transição segura',
    text: 'Migração completa sem interromper boletos nem pagamentos.',
  },
  {
    n: '04',
    title: 'Gestão de excelência',
    text: 'Processos, tecnologia e gente trabalhando por resultado.',
  },
]

export function CityLanding({ data }: { data: CityLandingData }) {
  const shortSlug = data.image.replace('/cities/', '').replace('.jpg', '')
  const heroVideo = `/hero/${shortSlug}.mp4`

  return (
    <main
      style={{
        background: NAVY_950,
        color: '#edf1fa',
        fontFamily: 'var(--font-satoshi), sans-serif',
        overflowX: 'hidden',
      }}
    >
      {/* ============ HERO ============ */}
      <section className="relative w-full overflow-hidden">
        <video
          autoPlay
          loop
          muted
          playsInline
          preload="metadata"
          poster={data.image}
          className="absolute inset-0 h-full w-full object-cover"
          style={{ opacity: 0.9 }}
        >
          <source src={heroVideo} type="video/mp4" />
        </video>
        <div
          aria-hidden="true"
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(105deg, rgba(5,8,26,0.94) 0%, rgba(5,8,26,0.74) 38%, rgba(5,8,26,0.42) 66%, rgba(5,8,26,0.6) 100%)',
          }}
        />
        <div
          aria-hidden="true"
          className="absolute inset-x-0 bottom-0 h-[45%]"
          style={{ background: `linear-gradient(180deg, transparent, ${NAVY_950})` }}
        />

        <div className="relative z-10 mx-auto grid w-full max-w-[1280px] grid-cols-1 items-center gap-x-12 gap-y-10 px-[clamp(1.25rem,4vw,3rem)] pt-[clamp(7rem,11vh,8.5rem)] pb-[clamp(3.5rem,6vw,5.5rem)] lg:grid-cols-[1.1fr_0.9fr]">
          <div className="max-w-[40rem]">
            <Reveal>
              <span
                className="mb-6 inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-[0.8rem] font-medium"
                style={{
                  borderColor: 'rgba(173,213,235,0.32)',
                  background: 'rgba(173,213,235,0.08)',
                  color: ICE,
                }}
              >
                <span
                  aria-hidden="true"
                  className="inline-block h-1.5 w-1.5 rounded-full"
                  style={{ background: ICE }}
                />
                G20 Superlógica · 3 anos consecutivos
              </span>
            </Reveal>
            <Reveal delay={0.08} as="h1">
              <span
                className="block text-[clamp(2.5rem,5vw,4.3rem)] font-medium leading-[1.03] tracking-[-0.01em]"
                style={{ fontFamily: DISPLAY, textShadow: '0 2px 40px rgba(5,8,26,0.6)' }}
              >
                Administradora de condomínios em {data.city}.
              </span>
            </Reveal>
            <Reveal delay={0.16}>
              <p
                className="mt-6 max-w-[34rem] text-[clamp(1.05rem,1.4vw,1.22rem)] leading-relaxed"
                style={{ color: '#cdd6ec' }}
              >
                {data.heroSubhead}
              </p>
            </Reveal>
            <Reveal delay={0.24}>
              <div className="mt-9 flex flex-wrap items-center gap-4">
                <a
                  href="#proposta"
                  className="rounded-full px-7 py-3.5 text-[0.98rem] font-semibold transition-transform active:scale-[0.98]"
                  style={{ background: ICE, color: NAVY_950 }}
                >
                  Solicitar proposta
                </a>
                <a
                  href={`https://wa.me/${data.unit.whatsapp}`}
                  target="_blank"
                  rel="noopener"
                  className="rounded-full border px-7 py-3.5 text-[0.98rem] font-medium transition-colors hover:border-[color:rgba(173,213,235,0.6)]"
                  style={{ borderColor: 'rgba(173,213,235,0.32)', color: '#edf1fa' }}
                >
                  Falar no WhatsApp
                </a>
              </div>
            </Reveal>
          </div>

          {/* form REAL compacto */}
          <Reveal delay={0.2} dir="scale">
            <div
              id="proposta"
              className="scroll-mt-28 rounded-[22px] border p-[clamp(1.4rem,2.4vw,2rem)]"
              style={{
                borderColor: 'rgba(173,213,235,0.22)',
                background: 'linear-gradient(160deg, rgba(16,26,72,0.82), rgba(5,8,26,0.86))',
                backdropFilter: 'blur(18px)',
                boxShadow:
                  '0 30px 80px -30px rgba(5,8,26,0.95), inset 0 1px 0 rgba(255,255,255,0.06)',
              }}
            >
              <h2
                className="text-[1.4rem] font-medium leading-tight"
                style={{ fontFamily: DISPLAY }}
              >
                Receba uma proposta sob medida.
              </h2>
              <p className="mt-2 mb-6 text-[0.9rem]" style={{ color: '#a9b4d6' }}>
                Um consultor da unidade de {data.city} responde em até 24h úteis.
              </p>
              <PropostaForm compact />
            </div>
          </Reveal>
        </div>
      </section>

      {/* ============ AUTORIDADE / G20 ============ */}
      <section className="mx-auto w-full max-w-[1280px] px-[clamp(1.25rem,4vw,3rem)] py-[clamp(4.5rem,8vw,7rem)]">
        <div className="grid gap-12 lg:grid-cols-[1fr_1.1fr] lg:items-center">
          <Reveal dir="left">
            <p
              className="text-[0.82rem] font-semibold uppercase tracking-[0.16em]"
              style={{ color: ICE }}
            >
              Autoridade que se comprova
            </p>
            <h2
              className="mt-4 text-[clamp(1.8rem,3.4vw,2.8rem)] font-medium leading-[1.08]"
              style={{ fontFamily: DISPLAY }}
            >
              Entre as 20 administradoras de destaque do Brasil.
            </h2>
            <p
              className="mt-5 max-w-[38ch] text-[1.02rem] leading-relaxed"
              style={{ color: '#b4bdd9' }}
            >
              A Semog integra o G20 da Superlógica, o principal ERP do mercado condominial, no ciclo
              2025/26. Melhor colocação: 3º lugar.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3 text-[0.9rem]">
              <span style={{ color: '#7e88ac' }}>Com cobertura em:</span>
              <a
                href="https://exame.com/negocios/g20-superlogica-administradoras-imobiliarias-futuro-do-morar/"
                target="_blank"
                rel="noopener"
                className="font-semibold underline underline-offset-4"
                style={{ color: ICE }}
              >
                Exame
              </a>
              <a
                href="https://www.sindiconet.com.br/informese/g20-comite-administradoras-condominios-noticias-mercado"
                target="_blank"
                rel="noopener"
                className="font-semibold underline underline-offset-4"
                style={{ color: ICE }}
              >
                Sindiconet
              </a>
            </div>
          </Reveal>

          <Reveal
            dir="right"
            className="grid grid-cols-2 gap-px overflow-hidden rounded-[18px]"
            style={{ background: 'rgba(173,213,235,0.14)' }}
          >
            {[
              { v: '35', s: 'anos', l: 'de experiência' },
              { v: '+650', s: '', l: 'condomínios atendidos' },
              { v: '+70', s: 'mil', l: 'clientes' },
              { v: '+100', s: '', l: 'especialistas' },
            ].map((it) => (
              <div
                key={it.l}
                className="p-[clamp(1.4rem,3vw,2.2rem)]"
                style={{ background: NAVY_900 }}
              >
                <div
                  className="text-[clamp(2.2rem,4vw,3.2rem)] font-medium leading-none"
                  style={{ fontFamily: DISPLAY }}
                >
                  {it.v}
                  {it.s && (
                    <span className="ml-1 text-[0.5em]" style={{ color: ICE }}>
                      {it.s}
                    </span>
                  )}
                </div>
                <div className="mt-2 text-[0.9rem]" style={{ color: '#8e97b8' }}>
                  {it.l}
                </div>
              </div>
            ))}
          </Reveal>
        </div>

        <div
          className="mt-14 flex flex-wrap items-center gap-x-10 gap-y-4 border-t pt-8"
          style={{ borderColor: 'rgba(173,213,235,0.12)' }}
        >
          <span className="text-[0.78rem] uppercase tracking-[0.14em]" style={{ color: '#7e88ac' }}>
            Confiança de quem gesta com a gente
          </span>
          {[`SECOVI · ${data.uf}`, 'ABADI', 'Superlógica G20', 'Empresa filiada'].map((s) => (
            <span key={s} className="text-[0.98rem] font-medium" style={{ color: '#b4bdd9' }}>
              {s}
            </span>
          ))}
        </div>
      </section>

      {/* ============ SOLUÇÕES (BENTO) ============ */}
      <section className="mx-auto w-full max-w-[1280px] px-[clamp(1.25rem,4vw,3rem)] pb-[clamp(4.5rem,8vw,7rem)]">
        <Reveal>
          <h2
            className="mb-12 max-w-[46rem] text-[clamp(1.9rem,3.6vw,3rem)] font-medium leading-[1.06]"
            style={{ fontFamily: DISPLAY }}
          >
            Uma gestão inteligente para condomínios mais tranquilos.
          </h2>
        </Reveal>
        <Stagger className="grid auto-rows-[minmax(148px,auto)] grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-6">
          {SOLUCOES.map((c) => (
            <article
              key={c.title}
              className={`group relative flex flex-col justify-between overflow-hidden rounded-[18px] border p-[clamp(1.4rem,2.2vw,1.9rem)] transition-colors duration-300 hover:border-[color:rgba(173,213,235,0.4)] ${c.span}`}
              style={{
                borderColor: c.exclusive ? 'rgba(173,213,235,0.35)' : 'rgba(173,213,235,0.14)',
                background: c.exclusive
                  ? 'radial-gradient(130% 130% at 85% 0%, rgba(43,63,150,0.55), rgba(10,16,46,0.5))'
                  : 'rgba(13,20,57,0.5)',
              }}
            >
              {c.exclusive && (
                <span
                  aria-hidden="true"
                  className="absolute inset-x-0 top-0 h-px"
                  style={{
                    background:
                      'linear-gradient(90deg, transparent, rgba(173,213,235,0.7), transparent)',
                  }}
                />
              )}
              <div>
                <div
                  className="mb-4 flex h-11 w-11 items-center justify-center rounded-[12px] border transition-transform duration-300 group-hover:-translate-y-0.5"
                  style={{
                    borderColor: 'rgba(173,213,235,0.2)',
                    background: 'rgba(173,213,235,0.06)',
                  }}
                >
                  <Icon d={c.icon} />
                </div>
                <h3
                  className={`font-medium leading-tight ${c.exclusive ? 'text-[1.45rem]' : 'text-[1.12rem]'}`}
                  style={{ fontFamily: DISPLAY }}
                >
                  {c.title}
                </h3>
                <p
                  className={`mt-2.5 leading-relaxed ${c.exclusive ? 'text-[1rem]' : 'text-[0.92rem]'}`}
                  style={{ color: '#a9b4d6' }}
                >
                  {c.text}
                </p>
              </div>
              {c.exclusive && (
                <span
                  className="mt-6 inline-flex w-fit items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[0.8rem] font-semibold"
                  style={{ background: ICE, color: NAVY_950 }}
                >
                  Exclusiva Semog
                </span>
              )}
            </article>
          ))}
        </Stagger>
      </section>

      {/* ============ DIFERENCIAIS ============ */}
      <section
        className="w-full border-y py-[clamp(4.5rem,8vw,7rem)]"
        style={{ borderColor: 'rgba(173,213,235,0.1)', background: NAVY_900 }}
      >
        <div className="mx-auto w-full max-w-[1280px] px-[clamp(1.25rem,4vw,3rem)]">
          <Reveal>
            <p
              className="text-[0.82rem] font-semibold uppercase tracking-[0.16em]"
              style={{ color: ICE }}
            >
              Por que a Semog
            </p>
            <h2
              className="mt-3 max-w-[40rem] text-[clamp(1.9rem,3.6vw,3rem)] font-medium leading-[1.06]"
              style={{ fontFamily: DISPLAY }}
            >
              O que nos torna a escolha certa.
            </h2>
          </Reveal>
          <Stagger className="mt-12 grid gap-8 md:grid-cols-3">
            {DIFERENCIAIS.map((d) => (
              <div key={d.title}>
                <div
                  className="mb-5 flex h-12 w-12 items-center justify-center rounded-[14px] border"
                  style={{
                    borderColor: 'rgba(173,213,235,0.22)',
                    background: 'rgba(173,213,235,0.06)',
                  }}
                >
                  <Icon d={d.icon} size={28} />
                </div>
                <h3 className="text-[1.2rem] font-medium" style={{ fontFamily: DISPLAY }}>
                  {d.title}
                </h3>
                <p className="mt-2.5 text-[0.98rem] leading-relaxed" style={{ color: '#a9b4d6' }}>
                  {d.text}
                </p>
              </div>
            ))}
          </Stagger>
        </div>
      </section>

      {/* ============ ONDE ATENDEMOS (LIGHT) ============ */}
      <section
        className="w-full py-[clamp(4.5rem,8vw,7rem)]"
        style={{ background: LIGHT, color: INK }}
      >
        <div className="mx-auto grid w-full max-w-[1280px] gap-10 px-[clamp(1.25rem,4vw,3rem)] lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <Reveal
            dir="left"
            className="relative overflow-hidden rounded-[22px]"
            style={{ minHeight: 460 }}
          >
            {/* biome-ignore lint/performance/noImgElement: hero/local visual, controle de layout próprio */}
            <img
              src={data.image}
              alt={`Administradora de condomínios em ${data.city}`}
              className="absolute inset-0 h-full w-full object-cover"
            />
          </Reveal>

          <Reveal dir="right">
            <p
              className="text-[0.82rem] font-semibold uppercase tracking-[0.16em]"
              style={{ color: '#3b54be' }}
            >
              {data.city} · {data.role}
            </p>
            <h2
              className="mt-3 text-[clamp(1.8rem,3.4vw,2.8rem)] font-medium leading-[1.06]"
              style={{ fontFamily: DISPLAY, color: INK }}
            >
              Atendemos todo o {data.ufFull}.
            </h2>
            <p
              className="mt-4 max-w-[42ch] text-[1.05rem] leading-relaxed"
              style={{ color: '#404a68' }}
            >
              {data.coverageText}
            </p>
            <div className="mt-5 flex flex-wrap gap-2.5">
              {data.neighborhoods.map((b) => (
                <span
                  key={b}
                  className="rounded-full border px-3.5 py-1.5 text-[0.88rem]"
                  style={{
                    borderColor: 'rgba(13,20,57,0.14)',
                    color: '#2a3356',
                    background: '#fff',
                  }}
                >
                  {b}
                </span>
              ))}
            </div>
            <div
              className="mt-8 flex flex-wrap items-center gap-x-8 gap-y-3 border-t pt-6"
              style={{ borderColor: 'rgba(13,20,57,0.1)' }}
            >
              <div>
                <div className="text-[0.78rem]" style={{ color: '#6a7396' }}>
                  Unidade {data.city}
                </div>
                <div className="text-[0.98rem] font-medium" style={{ color: INK }}>
                  {data.unit.address}
                </div>
                <a
                  href={data.unit.phoneHref}
                  className="text-[0.98rem] font-medium underline underline-offset-2"
                  style={{ color: '#1b2d70' }}
                >
                  {data.unit.phoneDisplay}
                </a>
              </div>
              <a
                href={data.unit.mapsHref}
                target="_blank"
                rel="noopener"
                className="rounded-full px-5 py-2.5 text-[0.9rem] font-semibold"
                style={{ background: INK, color: '#fff' }}
              >
                Como chegar
              </a>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ============ BANDA GARANTE ============ */}
      <section
        className="w-full py-[clamp(4rem,8vw,7rem)]"
        style={{ background: 'linear-gradient(160deg, #101a48 0%, #1b2d70 55%, #16225c 100%)' }}
      >
        <div className="mx-auto flex w-full max-w-[1280px] flex-col items-start gap-8 px-[clamp(1.25rem,4vw,3rem)] md:flex-row md:items-center md:justify-between">
          <Reveal dir="left" className="max-w-[34rem]">
            <h2
              className="text-[clamp(1.9rem,3.6vw,3rem)] font-medium leading-[1.05]"
              style={{ fontFamily: DISPLAY }}
            >
              Inadimplência zero também em {data.city}.
            </h2>
            <p className="mt-4 text-[1.05rem]" style={{ color: '#cdd6ec' }}>
              O Semog Garante assegura a arrecadação integral do condomínio em contrato. A cobrança
              é problema nosso.
            </p>
            <a
              href="/garante"
              className="mt-7 inline-flex rounded-full px-7 py-3.5 text-[0.98rem] font-semibold"
              style={{ background: '#edf1fa', color: NAVY_950 }}
            >
              Conhecer o Semog Garante
            </a>
          </Reveal>
          <Reveal dir="right" className="shrink-0 text-right">
            <div
              className="text-[clamp(4rem,10vw,7rem)] font-medium leading-none"
              style={{ fontFamily: DISPLAY, color: ICE }}
            >
              1%
            </div>
            <p className="text-[0.95rem]" style={{ color: '#cdd6ec' }}>
              da arrecadação. Só isso.
            </p>
          </Reveal>
        </div>
      </section>

      {/* ============ COMO FUNCIONA ============ */}
      <section className="mx-auto w-full max-w-[1280px] px-[clamp(1.25rem,4vw,3rem)] py-[clamp(4.5rem,8vw,7rem)]">
        <Reveal>
          <h2
            className="mb-12 max-w-[40rem] text-[clamp(1.9rem,3.6vw,3rem)] font-medium leading-[1.06]"
            style={{ fontFamily: DISPLAY }}
          >
            Um processo simples para transformar a gestão do seu condomínio.
          </h2>
        </Reveal>
        <Stagger className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((s) => (
            <div key={s.n}>
              <div
                className="text-[2.6rem] font-medium leading-none"
                style={{ fontFamily: DISPLAY, color: 'rgba(173,213,235,0.35)' }}
              >
                {s.n}
              </div>
              <h3 className="mt-4 text-[1.15rem] font-medium" style={{ fontFamily: DISPLAY }}>
                {s.title}
              </h3>
              <p className="mt-2 text-[0.95rem] leading-relaxed" style={{ color: '#a9b4d6' }}>
                {s.text}
              </p>
            </div>
          ))}
        </Stagger>
      </section>

      {/* ============ DEPOIMENTOS (LIGHT) ============ */}
      <section
        className="w-full py-[clamp(4.5rem,8vw,7rem)]"
        style={{ background: LIGHT, color: INK }}
      >
        <div className="mx-auto w-full max-w-[1280px] px-[clamp(1.25rem,4vw,3rem)]">
          <Reveal>
            <p
              className="text-[0.82rem] font-semibold uppercase tracking-[0.16em]"
              style={{ color: '#3b54be' }}
            >
              Quem já é Semog em {data.city}
            </p>
            <h2
              className="mt-3 max-w-[36rem] text-[clamp(1.8rem,3.4vw,2.8rem)] font-medium leading-[1.06]"
              style={{ fontFamily: DISPLAY, color: INK }}
            >
              A voz de quem vive nossos resultados.
            </h2>
          </Reveal>
          <Stagger className="mt-12 grid gap-6 md:grid-cols-3">
            {data.testimonials.map((d) => (
              <figure
                key={d.name}
                className="flex flex-col justify-between rounded-[18px] border bg-white p-[clamp(1.4rem,2.4vw,2rem)]"
                style={{ borderColor: 'rgba(13,20,57,0.1)' }}
              >
                <blockquote className="text-[1.02rem] leading-relaxed" style={{ color: '#2a3356' }}>
                  {d.quote}
                </blockquote>
                <figcaption className="mt-6">
                  <div className="text-[0.98rem] font-semibold" style={{ color: INK }}>
                    {d.name}
                  </div>
                  <div className="text-[0.86rem]" style={{ color: '#6a7396' }}>
                    {d.role}
                  </div>
                </figcaption>
              </figure>
            ))}
          </Stagger>
        </div>
      </section>

      {/* ============ FAQ ============ */}
      <section className="mx-auto w-full max-w-[980px] px-[clamp(1.25rem,4vw,3rem)] py-[clamp(4.5rem,8vw,7rem)]">
        <Reveal>
          <h2
            className="mb-10 text-[clamp(1.8rem,3.4vw,2.8rem)] font-medium leading-[1.06]"
            style={{ fontFamily: DISPLAY }}
          >
            Perguntas de quem busca administradora em {data.city}.
          </h2>
        </Reveal>
        <Stagger className="grid gap-3">
          {data.faq.map((f) => (
            <details
              key={f.question}
              className="group rounded-[14px] border px-[clamp(1.2rem,2.2vw,1.6rem)] py-4"
              style={{ borderColor: 'rgba(173,213,235,0.14)', background: 'rgba(13,20,57,0.4)' }}
            >
              <summary
                className="flex cursor-pointer list-none items-center justify-between gap-4 text-[1.05rem] font-medium"
                style={{ color: '#edf1fa' }}
              >
                {f.question}
                <span
                  aria-hidden="true"
                  className="shrink-0 text-[1.4rem] transition-transform group-open:rotate-45"
                  style={{ color: ICE }}
                >
                  +
                </span>
              </summary>
              <p className="mt-3 text-[0.98rem] leading-relaxed" style={{ color: '#a9b4d6' }}>
                {f.answer}
              </p>
            </details>
          ))}
        </Stagger>
      </section>

      {/* ============ CTA FINAL ============ */}
      <section className="mx-auto w-full max-w-[1280px] px-[clamp(1.25rem,4vw,3rem)] pb-[clamp(5rem,9vw,8rem)]">
        <Reveal dir="scale">
          <div
            className="flex flex-col items-start justify-between gap-8 rounded-[24px] border p-[clamp(2rem,5vw,4rem)] md:flex-row md:items-center"
            style={{
              borderColor: 'rgba(173,213,235,0.16)',
              background:
                'radial-gradient(120% 160% at 15% 0%, rgba(27,45,112,0.6), rgba(5,8,26,0.4))',
            }}
          >
            <h2
              className="max-w-[24ch] text-[clamp(1.9rem,3.6vw,3rem)] font-medium leading-[1.06]"
              style={{ fontFamily: DISPLAY }}
            >
              Seu condomínio em {data.city} merece a líder.
            </h2>
            <a
              href="#proposta"
              className="shrink-0 rounded-full px-8 py-4 text-[1rem] font-semibold"
              style={{ background: ICE, color: NAVY_950 }}
            >
              Solicitar proposta
            </a>
          </div>
        </Reveal>
      </section>
    </main>
  )
}
