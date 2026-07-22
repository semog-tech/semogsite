'use client'

/**
 * PROTÓTIPO v2 (descartável) do redesign da landing de cidade — Recife.
 * Ajustes do feedback: form alinhado ao título (sem transbordar quebrado),
 * seções CLARAS pra quebrar o navy, bairros deixando claro que atende PE
 * inteiro, seção de depoimentos, foto em alta e scroll-reveal (Reveal/Stagger).
 */

import { useId } from 'react'
import { Reveal, Stagger } from '@/motion/reveal'

const NAVY_950 = '#05081a'
const NAVY_900 = '#0a102e'
const ICE = '#add5eb'
const LIGHT = '#eef1f8'
const INK = '#0d1439'
const DISPLAY = 'var(--font-clash), system-ui, sans-serif'
const BODY = 'var(--font-satoshi), system-ui, sans-serif'

const NEIGHBORHOODS = [
  'Boa Viagem',
  'Casa Forte',
  'Graças',
  'Madalena',
  'Espinheiro',
  'Parnamirim',
  'Aflitos',
  'Pina',
  'Jaqueira',
  'Torre',
]

const SOLUCOES: { title: string; text: string; span: string; tint?: boolean; big?: boolean }[] = [
  {
    title: 'Prestação de contas 100% digital',
    text: 'O balancete que todos os condôminos entendem: documentos anexados, gráficos claros e assinatura com validade jurídica.',
    span: 'lg:col-span-3 lg:row-span-2',
    tint: true,
    big: true,
  },
  {
    title: 'Semog Garante',
    text: 'Inadimplência zero por 1% da arrecadação. A cobrança vira problema nosso.',
    span: 'lg:col-span-3',
  },
  {
    title: 'Gestão financeira e cobrança',
    text: 'Planejamento, controle e previsibilidade mês a mês.',
    span: 'lg:col-span-2',
  },
  {
    title: 'Assessoria jurídica',
    text: 'Contratos, convenções e conflitos com time próprio.',
    span: 'lg:col-span-2',
  },
  {
    title: 'Assembleias digitais',
    text: 'Convocação, condução e ata com validade.',
    span: 'lg:col-span-2',
  },
  {
    title: 'App para moradores e síndicos',
    text: 'Boletos, reservas e avisos na palma da mão.',
    span: 'lg:col-span-3',
  },
  {
    title: 'Atendimento próximo',
    text: 'Aqui, cliente fala com sócio, não com protocolo.',
    span: 'lg:col-span-3',
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

const DEPOIMENTOS = [
  {
    quote:
      'Trocamos de administradora depois de anos de balancete confuso. Com a prestação de contas digital, a assembleia aprova as contas em minutos.',
    name: 'Ricardo Menezes',
    role: 'Síndico · Ed. Solar de Boa Viagem',
  },
  {
    quote:
      'O atendimento é diferenciado. A equipe resolve com rapidez e sempre nos mantém informados do que acontece no prédio.',
    name: 'Fabiana Correia',
    role: 'Conselheira · Cond. Parque das Graças',
  },
  {
    quote:
      'Relatórios e prestação de contas claros, tudo no aplicativo. Muito mais segurança e tranquilidade pra quem é síndico.',
    name: 'Juliana Rocha',
    role: 'Síndica · Res. Madalena Prime',
  },
]

function FieldInput({
  label,
  placeholder,
  type = 'text',
}: {
  label: string
  placeholder: string
  type?: string
}) {
  const id = useId()
  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={id}
        className="text-[0.78rem] font-medium tracking-wide"
        style={{ color: '#c7d2ee' }}
      >
        {label}
      </label>
      <input
        id={id}
        type={type}
        placeholder={placeholder}
        className="rounded-[12px] border px-4 py-3 text-[0.95rem] outline-none"
        style={{
          background: 'rgba(5,8,26,0.55)',
          borderColor: 'rgba(173,213,235,0.18)',
          color: '#edf1fa',
        }}
      />
    </div>
  )
}

export default function ProtoRecife() {
  return (
    <main style={{ background: NAVY_950, color: '#edf1fa', fontFamily: BODY, overflowX: 'hidden' }}>
      {/* ============ HERO ============ */}
      <section className="relative w-full overflow-hidden" style={{ minHeight: '100dvh' }}>
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 h-full w-full object-cover"
          style={{ opacity: 0.9 }}
        >
          <source src="/hero/recife.mp4" type="video/mp4" />
        </video>
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(105deg, rgba(5,8,26,0.94) 0%, rgba(5,8,26,0.74) 38%, rgba(5,8,26,0.42) 66%, rgba(5,8,26,0.6) 100%)',
          }}
        />
        <div
          aria-hidden
          className="absolute inset-x-0 bottom-0 h-[35%]"
          style={{ background: `linear-gradient(180deg, transparent, ${NAVY_950})` }}
        />

        <div className="relative z-10 mx-auto grid w-full max-w-[1280px] grid-cols-1 items-start gap-x-12 gap-y-10 px-[clamp(1.25rem,4vw,3rem)] pt-[clamp(7rem,12vh,9rem)] pb-[clamp(3rem,6vw,5rem)] lg:grid-cols-[1.1fr_0.9fr]">
          {/* esquerda: mensagem */}
          <div className="max-w-[40rem] lg:pt-6">
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
                  aria-hidden
                  className="inline-block h-1.5 w-1.5 rounded-full"
                  style={{ background: ICE }}
                />
                G20 Superlógica · 3 anos consecutivos
              </span>
            </Reveal>
            <Reveal delay={0.08}>
              <h1
                className="text-[clamp(2.6rem,5.4vw,4.6rem)] font-medium leading-[1.03] tracking-[-0.01em]"
                style={{ fontFamily: DISPLAY, textShadow: '0 2px 40px rgba(5,8,26,0.6)' }}
              >
                Administradora de condomínios em Recife.
              </h1>
            </Reveal>
            <Reveal delay={0.16}>
              <p
                className="mt-6 max-w-[34rem] text-[clamp(1.05rem,1.4vw,1.22rem)] leading-relaxed"
                style={{ color: '#cdd6ec' }}
              >
                Tecnologia, transparência e uma equipe local que cuida do seu patrimônio como se
                fosse dela.
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
                  href="https://wa.me/551130034506"
                  className="rounded-full border px-7 py-3.5 text-[0.98rem] font-medium"
                  style={{ borderColor: 'rgba(173,213,235,0.32)', color: '#edf1fa' }}
                >
                  Falar no WhatsApp
                </a>
              </div>
            </Reveal>
          </div>

          {/* direita: form em vidro, alinhado ao topo do título */}
          <Reveal delay={0.2} dir="scale">
            <div
              id="proposta"
              className="rounded-[22px] border p-[clamp(1.4rem,2.4vw,2rem)]"
              style={{
                borderColor: 'rgba(173,213,235,0.22)',
                background: 'linear-gradient(160deg, rgba(16,26,72,0.78), rgba(5,8,26,0.82))',
                backdropFilter: 'blur(18px)',
                boxShadow:
                  '0 30px 80px -30px rgba(5,8,26,0.9), inset 0 1px 0 rgba(255,255,255,0.06)',
              }}
            >
              <h2
                className="text-[1.4rem] font-medium leading-tight"
                style={{ fontFamily: DISPLAY }}
              >
                Receba uma proposta sob medida.
              </h2>
              <p className="mt-2 text-[0.9rem]" style={{ color: '#a9b4d6' }}>
                Um consultor da unidade de Recife responde em até 24h úteis.
              </p>
              <div className="mt-6 grid gap-4">
                <FieldInput label="Seu nome" placeholder="Como devemos te chamar" />
                <FieldInput label="Nome do condomínio" placeholder="Ex.: Ed. Atlântico" />
                <div className="grid grid-cols-2 gap-4">
                  <FieldInput label="WhatsApp" placeholder="(81) 9 ..." />
                  <FieldInput label="Unidades" placeholder="Ex.: 40" />
                </div>
                <FieldInput label="E-mail" placeholder="voce@exemplo.com.br" type="email" />
                <button
                  type="button"
                  className="mt-1 rounded-[12px] px-6 py-3.5 text-[0.98rem] font-semibold transition-transform active:scale-[0.98]"
                  style={{ background: ICE, color: NAVY_950 }}
                >
                  Quero minha proposta
                </button>
                <p className="text-center text-[0.78rem]" style={{ color: '#7e88ac' }}>
                  Seus dados estão seguros. Sem compromisso.
                </p>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ============ AUTORIDADE / G20 + NÚMEROS (dark) ============ */}
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
            <a
              href="https://www.sindiconet.com.br/informese/g20-comite-administradoras-condominios-noticias-mercado"
              target="_blank"
              rel="noopener"
              className="mt-6 inline-flex items-center gap-2 text-[0.92rem] font-medium underline underline-offset-4"
              style={{ color: ICE }}
            >
              Veja a lista no Sindiconet
            </a>
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
          {['SECOVI · PE', 'ABADI', 'Superlógica G20', 'Empresa filiada'].map((s) => (
            <span key={s} className="text-[0.98rem] font-medium" style={{ color: '#b4bdd9' }}>
              {s}
            </span>
          ))}
        </div>
      </section>

      {/* ============ SOLUÇÕES (BENTO, dark) ============ */}
      <section className="mx-auto w-full max-w-[1280px] px-[clamp(1.25rem,4vw,3rem)] pb-[clamp(4.5rem,8vw,7rem)]">
        <Reveal>
          <h2
            className="mb-12 max-w-[46rem] text-[clamp(1.9rem,3.6vw,3rem)] font-medium leading-[1.06]"
            style={{ fontFamily: DISPLAY }}
          >
            Uma gestão inteligente para condomínios mais tranquilos.
          </h2>
        </Reveal>
        <Stagger className="grid auto-rows-[minmax(140px,auto)] grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-6">
          {SOLUCOES.map((c) => (
            <article
              key={c.title}
              className={`flex flex-col justify-between rounded-[18px] border p-[clamp(1.3rem,2.2vw,1.9rem)] ${c.span}`}
              style={{
                borderColor: 'rgba(173,213,235,0.14)',
                background: c.tint
                  ? 'radial-gradient(120% 130% at 80% 0%, rgba(43,63,150,0.5), rgba(10,16,46,0.4))'
                  : 'rgba(13,20,57,0.5)',
              }}
            >
              <div>
                <h3
                  className={`font-medium leading-tight ${c.big ? 'text-[1.5rem]' : 'text-[1.12rem]'}`}
                  style={{ fontFamily: DISPLAY }}
                >
                  {c.title}
                </h3>
                <p
                  className={`mt-2.5 leading-relaxed ${c.big ? 'text-[1rem]' : 'text-[0.92rem]'}`}
                  style={{ color: '#a9b4d6' }}
                >
                  {c.text}
                </p>
              </div>
              {c.big && (
                <span
                  className="mt-6 inline-flex w-fit items-center gap-2 rounded-full px-4 py-2 text-[0.85rem] font-semibold"
                  style={{ background: ICE, color: NAVY_950 }}
                >
                  Exclusiva Semog
                </span>
              )}
            </article>
          ))}
        </Stagger>
      </section>

      {/* ============ ONDE ATENDEMOS (LIGHT — quebra o navy) ============ */}
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
            {/* biome-ignore lint/performance/noImgElement: protótipo descartável, sem next/image */}
            <img
              src="/proto/recife.jpg"
              alt="Boa Viagem, Recife"
              className="absolute inset-0 h-full w-full object-cover"
            />
          </Reveal>

          <Reveal dir="right">
            <p
              className="text-[0.82rem] font-semibold uppercase tracking-[0.16em]"
              style={{ color: '#3b54be' }}
            >
              Recife · Matriz
            </p>
            <h2
              className="mt-3 text-[clamp(1.8rem,3.4vw,2.8rem)] font-medium leading-[1.06]"
              style={{ fontFamily: DISPLAY, color: INK }}
            >
              Atendemos todo o Pernambuco.
            </h2>
            <p
              className="mt-4 max-w-[42ch] text-[1.05rem] leading-relaxed"
              style={{ color: '#404a68' }}
            >
              Da Região Metropolitana do Recife ao interior do estado, sua gestão é local de ponta a
              ponta. Presença especialmente forte em:
            </p>
            <div className="mt-5 flex flex-wrap gap-2.5">
              {NEIGHBORHOODS.map((b) => (
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
                  Unidade Recife
                </div>
                <div className="text-[0.98rem] font-medium" style={{ color: INK }}>
                  R. Bartolomeu de Gusmão, 217 · Madalena
                </div>
              </div>
              <a
                href="https://maps.google.com/?q=Semog+Recife+Madalena"
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

      {/* ============ BANDA GARANTE (quebra de ritmo) ============ */}
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
              Inadimplência zero também em Recife.
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

      {/* ============ COMO FUNCIONA (dark) ============ */}
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
              Quem já é Semog em Recife
            </p>
            <h2
              className="mt-3 max-w-[36rem] text-[clamp(1.8rem,3.4vw,2.8rem)] font-medium leading-[1.06]"
              style={{ fontFamily: DISPLAY, color: INK }}
            >
              A voz de quem vive nossos resultados.
            </h2>
          </Reveal>
          <Stagger className="mt-12 grid gap-6 md:grid-cols-3">
            {DEPOIMENTOS.map((d) => (
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

      {/* ============ CTA FINAL (dark) ============ */}
      <section className="mx-auto w-full max-w-[1280px] px-[clamp(1.25rem,4vw,3rem)] py-[clamp(5rem,9vw,8rem)]">
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
              Seu condomínio em Recife merece a líder.
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
