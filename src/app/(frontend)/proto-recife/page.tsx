'use client'

/**
 * PROTÓTIPO (descartável) do redesign da landing de cidade — Recife.
 * Rota isolada `/proto-recife` só pra validação visual do novo design.
 * Conteúdo hardcoded, sem CMS. Depois de aprovado, vira bloco/CMS.
 *
 * Direção: premium navy/ice cinematográfico, composição em camadas
 * (hero com form em vidro transbordando, faixa de autoridade G20, bento
 * com ritmo, seção local mapa+foto, banda Garante). Acento único: ice-400.
 */

import { useId } from 'react'

const NAVY_950 = '#05081a'
const NAVY_900 = '#0a102e'
const ICE = '#add5eb'
const DISPLAY = 'var(--font-clash), system-ui, sans-serif'
const BODY = 'var(--font-satoshi), system-ui, sans-serif'

const NEIGHBORHOODS = [
  'Boa Viagem',
  'Casa Forte',
  'Graças',
  'Madalena',
  'Pina',
  'Espinheiro',
  'Parnamirim',
  'Aflitos',
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
    text: 'Fala com sócio, não com protocolo.',
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

const FieldInput = ({
  label,
  placeholder,
  type = 'text',
}: {
  label: string
  placeholder: string
  type?: string
}) => {
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
        className="rounded-[12px] border px-4 py-3 text-[0.95rem] outline-none transition-colors focus:border-[color:var(--ice)]"
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
      <section className="relative min-h-[100dvh] w-full overflow-hidden">
        {/* vídeo cinematográfico de Recife */}
        <video
          autoPlay
          loop
          muted
          playsInline
          poster=""
          className="absolute inset-0 h-full w-full object-cover"
          style={{ opacity: 0.9 }}
        >
          <source src="/hero/recife.mp4" type="video/mp4" />
        </video>
        {/* scrim em camadas */}
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(105deg, rgba(5,8,26,0.92) 0%, rgba(5,8,26,0.72) 34%, rgba(5,8,26,0.32) 62%, rgba(5,8,26,0.55) 100%)',
          }}
        />
        <div
          aria-hidden
          className="absolute inset-x-0 bottom-0 h-[45%]"
          style={{ background: `linear-gradient(180deg, transparent, ${NAVY_950})` }}
        />

        <div className="relative z-10 mx-auto grid min-h-[100dvh] w-full max-w-[1280px] grid-cols-1 items-end gap-10 px-[clamp(1.25rem,4vw,3rem)] pb-[clamp(3rem,7vw,6rem)] pt-[8rem] lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
          {/* coluna esquerda: mensagem */}
          <div className="max-w-[42rem]">
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
            <h1
              className="text-[clamp(2.7rem,6vw,5rem)] font-medium leading-[1.02] tracking-[-0.01em]"
              style={{ fontFamily: DISPLAY, textShadow: '0 2px 40px rgba(5,8,26,0.6)' }}
            >
              Administradora de condomínios em Recife.
            </h1>
            <p
              className="mt-6 max-w-[34rem] text-[clamp(1.05rem,1.5vw,1.25rem)] leading-relaxed"
              style={{ color: '#cdd6ec' }}
            >
              Tecnologia, transparência e uma equipe local que cuida do seu patrimônio como se fosse
              dela.
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-4">
              <a
                href="#proposta"
                className="rounded-full px-7 py-3.5 text-[0.98rem] font-semibold transition-transform active:scale-[0.98]"
                style={{ background: ICE, color: NAVY_950 }}
              >
                Solicitar proposta
              </a>
              <a
                href="/proposta"
                className="rounded-full border px-7 py-3.5 text-[0.98rem] font-medium transition-colors"
                style={{ borderColor: 'rgba(173,213,235,0.32)', color: '#edf1fa' }}
              >
                Falar no WhatsApp
              </a>
            </div>
          </div>

          {/* coluna direita: form em vidro que transborda pra próxima seção */}
          <div id="proposta" className="relative lg:mb-[-9rem] lg:self-end">
            <div
              className="rounded-[22px] border p-[clamp(1.4rem,2.4vw,2rem)]"
              style={{
                borderColor: 'rgba(173,213,235,0.22)',
                background: 'linear-gradient(160deg, rgba(16,26,72,0.72), rgba(5,8,26,0.78))',
                backdropFilter: 'blur(18px)',
                boxShadow:
                  '0 30px 80px -30px rgba(5,8,26,0.9), inset 0 1px 0 rgba(255,255,255,0.06)',
              }}
            >
              <h2
                className="text-[1.4rem] font-medium leading-tight"
                style={{ fontFamily: DISPLAY }}
              >
                Receba uma proposta
                <br />
                sob medida.
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
          </div>
        </div>
      </section>

      {/* ============ AUTORIDADE / G20 + NÚMEROS ============ */}
      <section className="relative mx-auto w-full max-w-[1280px] px-[clamp(1.25rem,4vw,3rem)] pt-[clamp(9rem,14vw,12rem)] pb-[clamp(4rem,7vw,6rem)]">
        <div className="grid gap-12 lg:grid-cols-[1fr_1.1fr] lg:items-center">
          <div>
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
          </div>

          {/* números respirando, sem caixinhas */}
          <div
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
          </div>
        </div>

        {/* selos */}
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

      {/* ============ SOLUÇÕES (BENTO) ============ */}
      <section className="mx-auto w-full max-w-[1280px] px-[clamp(1.25rem,4vw,3rem)] py-[clamp(4rem,7vw,6rem)]">
        <div className="mb-12 max-w-[46rem]">
          <h2
            className="text-[clamp(1.9rem,3.6vw,3rem)] font-medium leading-[1.06]"
            style={{ fontFamily: DISPLAY }}
          >
            Uma gestão inteligente para condomínios mais tranquilos.
          </h2>
        </div>
        <div className="grid auto-rows-[minmax(140px,auto)] grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-6">
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
        </div>
      </section>

      {/* ============ ONDE ATENDEMOS (MAPA + FOTO) ============ */}
      <section className="mx-auto w-full max-w-[1280px] px-[clamp(1.25rem,4vw,3rem)] py-[clamp(4rem,7vw,6rem)]">
        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          {/* foto de Recife */}
          <div className="relative overflow-hidden rounded-[22px]" style={{ minHeight: 420 }}>
            {/* biome-ignore lint/performance/noImgElement: protótipo descartável, sem next/image */}
            <img
              src="https://qvxlkovrxfqigeaopvui.supabase.co/storage/v1/object/public/media/recife.webp"
              alt="Vista de Recife"
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div
              aria-hidden
              className="absolute inset-0"
              style={{ background: 'linear-gradient(180deg, rgba(5,8,26,0.1), rgba(5,8,26,0.85))' }}
            />
            <div className="absolute inset-x-0 bottom-0 p-[clamp(1.5rem,3vw,2.5rem)]">
              <p
                className="text-[0.82rem] font-semibold uppercase tracking-[0.16em]"
                style={{ color: ICE }}
              >
                Recife · Matriz
              </p>
              <h2
                className="mt-2 text-[clamp(1.7rem,3vw,2.4rem)] font-medium leading-[1.05]"
                style={{ fontFamily: DISPLAY }}
              >
                Quem conhece Recife entende os condomínios daqui.
              </h2>
            </div>
          </div>

          {/* bairros + unidade */}
          <div
            className="flex flex-col justify-between rounded-[22px] border p-[clamp(1.6rem,3vw,2.4rem)]"
            style={{ borderColor: 'rgba(173,213,235,0.14)', background: NAVY_900 }}
          >
            <div>
              <h3 className="text-[1.1rem] font-medium" style={{ fontFamily: DISPLAY }}>
                Bairros com forte presença
              </h3>
              <div className="mt-5 flex flex-wrap gap-2.5">
                {NEIGHBORHOODS.map((b) => (
                  <span
                    key={b}
                    className="rounded-full border px-3.5 py-1.5 text-[0.88rem]"
                    style={{ borderColor: 'rgba(173,213,235,0.2)', color: '#cdd6ec' }}
                  >
                    {b}
                  </span>
                ))}
              </div>
            </div>
            <div className="mt-8 border-t pt-6" style={{ borderColor: 'rgba(173,213,235,0.12)' }}>
              <dl className="grid gap-3 text-[0.95rem]">
                <div className="flex justify-between gap-4">
                  <dt style={{ color: '#7e88ac' }}>Endereço</dt>
                  <dd className="text-right" style={{ color: '#edf1fa' }}>
                    R. Bartolomeu de Gusmão, 217 · Madalena
                  </dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt style={{ color: '#7e88ac' }}>Telefone</dt>
                  <dd style={{ color: '#edf1fa' }}>(81) 3316-0265</dd>
                </div>
              </dl>
              <a
                href="/proposta"
                className="mt-6 inline-flex rounded-full border px-5 py-2.5 text-[0.9rem] font-medium"
                style={{ borderColor: 'rgba(173,213,235,0.3)', color: ICE }}
              >
                Como chegar
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ============ BANDA GARANTE (quebra de ritmo) ============ */}
      <section
        className="w-full py-[clamp(4rem,8vw,7rem)]"
        style={{ background: 'linear-gradient(160deg, #101a48 0%, #1b2d70 55%, #16225c 100%)' }}
      >
        <div className="mx-auto flex w-full max-w-[1280px] flex-col items-start gap-8 px-[clamp(1.25rem,4vw,3rem)] md:flex-row md:items-center md:justify-between">
          <div className="max-w-[34rem]">
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
          </div>
          <div className="shrink-0 text-right">
            <div
              className="text-[clamp(4rem,10vw,7rem)] font-medium leading-none"
              style={{ fontFamily: DISPLAY, color: ICE }}
            >
              1%
            </div>
            <p className="text-[0.95rem]" style={{ color: '#cdd6ec' }}>
              da arrecadação. Só isso.
            </p>
          </div>
        </div>
      </section>

      {/* ============ COMO FUNCIONA (PROCESSO) ============ */}
      <section className="mx-auto w-full max-w-[1280px] px-[clamp(1.25rem,4vw,3rem)] py-[clamp(4rem,7vw,6rem)]">
        <h2
          className="mb-12 max-w-[40rem] text-[clamp(1.9rem,3.6vw,3rem)] font-medium leading-[1.06]"
          style={{ fontFamily: DISPLAY }}
        >
          Um processo simples para transformar a gestão do seu condomínio.
        </h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((s) => (
            <div key={s.n} className="relative">
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
        </div>
      </section>

      <div className="py-16 text-center text-[0.85rem]" style={{ color: '#7e88ac' }}>
        [ protótipo · fim das seções principais ]
      </div>
    </main>
  )
}
