import { PropostaForm } from '@/components/forms/PropostaForm'
import { CAMPANHA_BLACK_FRIDAY, MENSAGEM_BLACK_FRIDAY } from '@/lib/blackFriday'
import { Reveal, Stagger } from '@/motion/reveal'

/**
 * Landing da Black Friday 2026 (chamado #121). Server component, no mesmo
 * idioma visual das landings de unidade (`CityLanding`): navy profundo, acento
 * ice, Clash nos títulos e Satoshi no corpo. A oferta e a linha do tempo
 * (Hoje / R$ 0 / Fev/27) repetem as do e-mail da campanha
 * (`public/email/black-friday-2026.html`), aqui sem o recorte de ex-clientes.
 *
 * Captação pelo formulário real de proposta (`PropostaForm` compacto), que
 * marca o lead com a campanha, e pelos canais diretos: o WhatsApp comercial da
 * campanha e o e-mail. Nada de contador de vagas: a página não sabe quantas
 * restam, e mostrar um número inventado seria dado falso na tela.
 */

const EMAIL = 'ola@semog.com.br'
/**
 * WhatsApp comercial da campanha — o mesmo do e-mail (`black-friday-2026.html`),
 * não o central do site: quem atende as vagas é o comercial. O botão flutuante
 * do layout continua no central.
 */
const WHATSAPP_DISPLAY = '(83) 99914-7878'
const WHATSAPP_HREF = `https://wa.me/5583999147878?text=${encodeURIComponent(MENSAGEM_BLACK_FRIDAY)}`

const LINHA_DO_TEMPO = [
  { marco: 'Hoje', texto: 'Você garante a vaga e a Semog assume a gestão do condomínio.' },
  { marco: 'R$ 0', texto: 'De taxa de administração até janeiro de 2027.' },
  { marco: 'Fev/27', texto: 'Primeira cobrança da taxa de administração.' },
]

const NUMEROS = [
  { valor: '35', sufixo: 'anos', rotulo: 'de experiência' },
  { valor: '+650', sufixo: '', rotulo: 'condomínios atendidos' },
  { valor: '+70', sufixo: 'mil', rotulo: 'clientes' },
  { valor: 'G20', sufixo: '', rotulo: 'Superlógica, 3º ciclo seguido' },
]

const DIFERENCIAIS = [
  {
    titulo: 'Prestação de contas 100% digital',
    texto:
      'Balancete aberto a todos os condôminos, com documentos anexados, gráficos claros e assinatura digital.',
  },
  {
    titulo: 'Semog Garante',
    texto:
      'Inadimplência zero por 1% da arrecadação: o condomínio recebe 100% da receita prevista.',
  },
  {
    titulo: 'Gente na relação',
    texto:
      'Equipe local especializada, financeiro e contábil próprios e suporte jurídico de escritório parceiro.',
  },
]

const PASSOS = [
  {
    titulo: 'Reserve a vaga',
    texto: 'Preencha o formulário ou chame no WhatsApp. As vagas seguem a ordem de chegada.',
  },
  {
    titulo: 'Proposta sob medida',
    texto: 'Um consultor entende o momento do condomínio e apresenta a proposta.',
  },
  {
    titulo: 'Transição segura',
    texto:
      'Migração completa sem interromper boletos nem pagamentos. A primeira taxa vem em fevereiro.',
  },
]

function Seta() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="h-[1.1em] w-[1.1em]"
    >
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  )
}

function Hero() {
  return (
    <section className="relative w-full overflow-hidden">
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(90% 70% at 85% 10%, rgba(43,63,150,0.45), transparent 60%), radial-gradient(60% 60% at 0% 100%, rgba(173,213,235,0.10), transparent 60%)',
        }}
      />
      <div className="relative z-10 mx-auto grid w-full max-w-[1280px] grid-cols-1 items-center gap-x-12 gap-y-10 px-[clamp(1.25rem,4vw,3rem)] pt-[clamp(7rem,11vh,8.5rem)] pb-[clamp(3.5rem,6vw,5.5rem)] lg:grid-cols-[1.1fr_0.9fr]">
        <div className="max-w-[40rem]">
          <Reveal>
            <span className="mb-6 inline-flex items-center gap-2 rounded-pill border border-ice-400/35 bg-ice-400/10 px-3.5 py-1.5 text-[0.85rem] font-semibold text-ice-400">
              <span
                aria-hidden="true"
                className="inline-block h-1.5 w-1.5 rounded-full bg-ice-400"
              />
              Black Friday 2026 · apenas 10 vagas
            </span>
          </Reveal>
          <Reveal delay={0.08} as="h1">
            <span className="block font-display text-[clamp(2.5rem,5vw,4.3rem)] font-medium leading-[1.03] tracking-[-0.01em]">
              Feche agora e só pague a primeira taxa em{' '}
              <span className="text-ice-400">fevereiro de 2027</span>.
            </span>
          </Reveal>
          <Reveal delay={0.16}>
            <p className="mt-6 max-w-[34rem] text-[clamp(1.05rem,1.4vw,1.22rem)] leading-relaxed text-[#cdd6ec]">
              A Semog assume a gestão do seu condomínio já, e a taxa de administração fica por nossa
              conta até lá. Condição válida para os 10 primeiros condomínios que fecharem contrato.
            </p>
          </Reveal>
          <Reveal delay={0.24}>
            <div className="mt-9 flex flex-wrap items-center gap-4">
              <a
                href="#proposta"
                className="inline-flex items-center gap-2 rounded-pill bg-ice-400 px-7 py-3.5 text-[0.98rem] font-semibold text-navy-950 transition-transform hover:bg-ice-300 active:scale-[0.98]"
              >
                Quero minha vaga
                <Seta />
              </a>
              <a
                href={WHATSAPP_HREF}
                target="_blank"
                rel="noopener"
                className="rounded-pill border border-ice-400/35 px-7 py-3.5 text-[0.98rem] font-medium text-[#edf1fa] transition-colors hover:border-ice-400/70"
              >
                Falar no WhatsApp
              </a>
            </div>
          </Reveal>
        </div>

        <Reveal delay={0.2} dir="scale">
          <div
            id="proposta"
            className="scroll-mt-28 rounded-[22px] border border-ice-400/25 p-[clamp(1.4rem,2.4vw,2rem)]"
            style={{
              background: 'linear-gradient(160deg, rgba(16,26,72,0.82), rgba(5,8,26,0.86))',
              backdropFilter: 'blur(18px)',
              boxShadow:
                '0 30px 80px -30px rgba(5,8,26,0.95), inset 0 1px 0 rgba(255,255,255,0.06)',
            }}
          >
            <h2 className="font-display text-[1.4rem] font-medium leading-tight">
              Garanta uma das 10 vagas.
            </h2>
            <p className="mt-2 mb-6 text-[0.9rem] text-[#a9b4d6]">
              Um consultor da Semog responde em até 24h úteis.
            </p>
            <PropostaForm compact campanha={CAMPANHA_BLACK_FRIDAY} />
          </div>
        </Reveal>
      </div>
    </section>
  )
}

function FaixaDeVagas() {
  return (
    <div className="w-full bg-ice-400 px-6 py-4 text-center text-[0.95rem] font-bold text-navy-900">
      Apenas 10 vagas · por ordem de chegada
    </div>
  )
}

function LinhaDoTempo() {
  return (
    <section className="mx-auto w-full max-w-[1280px] px-[clamp(1.25rem,4vw,3rem)] py-[clamp(4.5rem,8vw,7rem)]">
      <Reveal>
        <h2 className="max-w-[40rem] font-display text-[clamp(1.9rem,3.6vw,3rem)] font-medium leading-[1.06]">
          A gestão começa agora. A cobrança, só em fevereiro.
        </h2>
        <p className="mt-4 max-w-[46rem] text-[1.05rem] leading-relaxed text-[#b4bdd9]">
          Mesma equipe, mesma transparência e o mesmo contrato de sempre. A diferença é que você só
          paga a primeira taxa de administração em fevereiro de 2027.
        </p>
      </Reveal>
      <Stagger className="mt-12 grid gap-4 md:grid-cols-3">
        {LINHA_DO_TEMPO.map((item) => (
          <div
            key={item.marco}
            className="rounded-[18px] border border-ice-400/15 bg-navy-850/50 p-[clamp(1.4rem,2.4vw,2rem)]"
          >
            <div className="font-display text-[clamp(2.4rem,4.4vw,3.4rem)] font-medium leading-none text-ice-400">
              {item.marco}
            </div>
            <p className="mt-3 text-[1rem] leading-relaxed text-[#cdd6ec]">{item.texto}</p>
          </div>
        ))}
      </Stagger>
    </section>
  )
}

function PorQueSemog() {
  return (
    <section className="w-full border-y border-ice-400/10 bg-navy-900 py-[clamp(4.5rem,8vw,7rem)]">
      <div className="mx-auto grid w-full max-w-[1280px] gap-12 px-[clamp(1.25rem,4vw,3rem)] lg:grid-cols-[1fr_1.1fr] lg:items-center">
        <Reveal dir="left">
          <h2 className="font-display text-[clamp(1.9rem,3.6vw,3rem)] font-medium leading-[1.06]">
            A administradora líder do Nordeste, agora com a primeira taxa em fevereiro.
          </h2>
          <ul className="mt-8 flex flex-col gap-6">
            {DIFERENCIAIS.map((d) => (
              <li key={d.titulo} className="border-l-2 border-ice-400/40 pl-5">
                <h3 className="font-display text-[1.2rem] font-medium">{d.titulo}</h3>
                <p className="mt-1.5 text-[0.98rem] leading-relaxed text-[#a9b4d6]">{d.texto}</p>
              </li>
            ))}
          </ul>
        </Reveal>
        <Reveal
          dir="right"
          className="grid grid-cols-2 gap-px overflow-hidden rounded-[18px] bg-ice-400/15"
        >
          {NUMEROS.map((n) => (
            <div key={n.rotulo} className="bg-navy-950 p-[clamp(1.4rem,3vw,2.2rem)]">
              <div className="font-display text-[clamp(2.2rem,4vw,3.2rem)] font-medium leading-none">
                {n.valor}
                {n.sufixo && <span className="ml-1 text-[0.5em] text-ice-400">{n.sufixo}</span>}
              </div>
              <div className="mt-2 text-[0.9rem] text-[#8e97b8]">{n.rotulo}</div>
            </div>
          ))}
        </Reveal>
      </div>
    </section>
  )
}

function ComoFunciona() {
  return (
    <section className="mx-auto w-full max-w-[1280px] px-[clamp(1.25rem,4vw,3rem)] py-[clamp(4.5rem,8vw,7rem)]">
      <Reveal>
        <h2 className="max-w-[40rem] font-display text-[clamp(1.9rem,3.6vw,3rem)] font-medium leading-[1.06]">
          Como garantir a sua vaga.
        </h2>
      </Reveal>
      <Stagger className="mt-12 grid gap-6 md:grid-cols-3">
        {PASSOS.map((p) => (
          <div
            key={p.titulo}
            className="rounded-[18px] border border-ice-400/15 p-[clamp(1.4rem,2.4vw,2rem)]"
          >
            <h3 className="font-display text-[1.2rem] font-medium">{p.titulo}</h3>
            <p className="mt-2.5 text-[0.98rem] leading-relaxed text-[#a9b4d6]">{p.texto}</p>
          </div>
        ))}
      </Stagger>
    </section>
  )
}

function Contato() {
  return (
    <section
      className="w-full py-[clamp(4rem,8vw,7rem)]"
      style={{ background: 'linear-gradient(160deg, #101a48 0%, #1b2d70 55%, #16225c 100%)' }}
    >
      <div className="mx-auto flex w-full max-w-[1280px] flex-col items-start gap-8 px-[clamp(1.25rem,4vw,3rem)] md:flex-row md:items-center md:justify-between">
        <Reveal dir="left" className="max-w-[36rem]">
          <h2 className="font-display text-[clamp(1.9rem,3.6vw,3rem)] font-medium leading-[1.05]">
            Quando as 10 vagas acabarem, a condição encerra.
          </h2>
          <p className="mt-4 text-[1.05rem] text-[#cdd6ec]">
            Fale com o comercial da Semog pelo WhatsApp {WHATSAPP_DISPLAY} ou pelo e-mail{' '}
            <a
              href={`mailto:${EMAIL}?subject=${encodeURIComponent('Black Friday Semog — quero uma das 10 vagas')}`}
              className="font-semibold text-ice-400 underline underline-offset-4"
            >
              {EMAIL}
            </a>
            .
          </p>
        </Reveal>
        <Reveal dir="right" className="flex shrink-0 flex-wrap gap-4">
          <a
            href={WHATSAPP_HREF}
            target="_blank"
            rel="noopener"
            className="inline-flex items-center gap-2 rounded-pill bg-ice-400 px-7 py-3.5 text-[0.98rem] font-semibold text-navy-950 transition-transform hover:bg-ice-300 active:scale-[0.98]"
          >
            Chamar no WhatsApp
            <Seta />
          </a>
          <a
            href="#proposta"
            className="rounded-pill border border-white/30 px-7 py-3.5 text-[0.98rem] font-medium text-[#edf1fa] transition-colors hover:border-white/70"
          >
            Preencher o formulário
          </a>
        </Reveal>
      </div>
    </section>
  )
}

function LetraMiuda() {
  return (
    <section className="mx-auto w-full max-w-[1280px] px-[clamp(1.25rem,4vw,3rem)] py-10">
      <p className="max-w-[70rem] text-[0.85rem] leading-relaxed text-[#8e97b8]">
        * Isenção da taxa de administração até janeiro de 2027, com a primeira cobrança em fevereiro
        de 2027. Válida para os 10 primeiros condomínios que formalizarem contrato com a Semog
        durante a campanha de Black Friday 2026, por ordem de chegada. Sujeita a análise e às
        condições contratuais.
      </p>
    </section>
  )
}

export function BlackFridayLanding() {
  return (
    <div className="overflow-x-hidden bg-navy-950 font-body text-[#edf1fa]">
      <Hero />
      <FaixaDeVagas />
      <LinhaDoTempo />
      <PorQueSemog />
      <ComoFunciona />
      <Contato />
      <LetraMiuda />
    </div>
  )
}
