import { site } from '@/../content/site'
import { EXPERIENCE_EVENT as E } from '@/data/experienceEvent'

/**
 * Onde e quando se retira o kit praia. Seção nova (14/09/2026): até aqui a
 * retirada era meia frase dentro do item das 07h da programação — item que
 * saiu junto com o credenciamento —, e o objeto `kit` do dado não era
 * consumido por componente nenhum.
 *
 * Fica logo DEPOIS da programação e antes do vídeo, não perto do rodapé: a
 * retirada é antecipada e condicional ("não há entrega no dia"), então precisa
 * ser lida por quem ainda está decidindo, não descoberta depois da inscrição.
 *
 * O endereço NÃO é digitado aqui. Sai de `content/site.ts`, casando pela
 * cidade do evento — mesmo caminho que `ExperienceFooter` já usa para o
 * telefone. Esse endereço também alimenta o JSON-LD das landings de cidade
 * (`src/lib/seo.ts`); redigitá-lo aqui abriria uma quinta cópia para divergir.
 */
export function ExperienceKit() {
  const unidade = site.company.addresses.find((endereco) => endereco.city === E.city)
  const { pickup } = E.kit

  return (
    <section className="kit s-paper" id="kit">
      <div className="wrap">
        <div className="grid">
          <div className="kit-intro">
            <span className="eyebrow">{E.kit.label}</span>
            <h2 className="sec-title">
              O seu kit é retirado <em>antes</em> do evento
            </h2>
            <p>
              Cada inscrito tem um kit reservado. Ele não é entregue na praia: você passa na filial
              da Semog e já leva tudo pronto para o sábado.
            </p>
            {/* biome-ignore lint/a11y/noRedundantRoles: redundante no papel, necessário na prática — com `list-style: none` o Safari/VoiceOver descarta a semântica de lista */}
            <ul className="kit-itens" role="list">
              {E.kit.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>

          <div className="card kit-retirada">
            <strong className="kit-rot">Retirada</strong>
            <p className="kit-quando">
              A partir das {pickup.fromTimeLabel} de{' '}
              <time dateTime={pickup.fromDate}>
                {pickup.fromWeekday}, {pickup.fromDateLabel}
              </time>
            </p>
            <p className="kit-onde">
              Filial da Semog em {E.city}
              {/*
                Ausente só se a unidade sumir de `content/site.ts` — o que um
                teste em `experience-data.int.spec.ts` impede. A guarda existe
                para que, se sumir, a página deixe de mostrar o endereço em vez
                de mostrar um endereço pela metade.
              */}
              {unidade && <span>{unidade.address}</span>}
            </p>
            <p className="kit-aviso">
              <svg
                aria-hidden="true"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
                viewBox="0 0 24 24"
              >
                <circle cx="12" cy="12" r="9" />
                <path d="M12 7.5v5.5M12 16.4v.1" />
              </svg>
              Não há entrega no dia do evento. Quem não retirar na filial antes do sábado não recebe
              o kit na praia.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
