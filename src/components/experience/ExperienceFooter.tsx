import { site } from '@/../content/site'
import { EXPERIENCE_EVENT as E } from '@/data/experienceEvent'

/**
 * Rodapé da landing — porte do `<footer class="s-deep">` do protótipo
 * aprovado. Sem menu de navegação do site, que é o ponto da página isolada:
 * o único link para fora é a política de privacidade (obrigatória) e os
 * canais de contato.
 *
 * DIVERGÊNCIA DELIBERADA DO PROTÓTIPO — dado de contato, não copy: ele trazia
 * "(83) 2106-0400" e "contato@semog.com.br". O primeiro não é telefone da
 * Semog em lugar nenhum (`content/site.ts` lista quatro unidades e nenhuma tem
 * esse número); o segundo é o e-mail do site ANTIGO, trocado por
 * `ola@semog.com.br` na migração (ver `content/pages/contato.ts`). Publicar
 * qualquer um dos dois seria dar ao inscrito um canal que não atende. O
 * telefone sai de `content/site.ts`, da unidade que sedia o evento — se o
 * evento mudar de cidade, o rodapé acompanha.
 *
 * O link de privacidade é `<a>` e não `<Link>` de propósito: `(evento)` é um
 * root layout irmão de `(frontend)`, e atravessar root layouts recarrega a
 * página inteira de qualquer forma — o `<Link>` só custaria prefetch de um
 * documento que não vai ser reaproveitado.
 */
export function ExperienceFooter() {
  const unidade = site.company.addresses.find((endereco) => endereco.city === E.city)
  const telefone = unidade?.phone

  return (
    <footer className="s-deep">
      <div className="wrap">
        <div className="fcol">
          {/* biome-ignore lint/performance/noImgElement: SVG de /public, sem otimização a fazer (mesmo caso do FooterView) */}
          <img
            alt="Semog Administradora de Condomínios"
            className="logo"
            height={25}
            src="/semog-logo-light.svg"
            style={{ marginBottom: '0.7rem' }}
            width={160}
          />
          <span style={{ maxWidth: '30ch' }}>
            Há mais de 35 anos cuidando de pessoas e valorizando lugares.
          </span>
        </div>
        <div className="fcol">
          <strong>O evento</strong>
          <span>
            {E.dateLabel} · {E.weekday}
          </span>
          <span>{E.timeLabel}</span>
          <span>
            {E.venue} — {E.city}, {E.uf}
          </span>
          {!E.venueConfirmed && <span className="pending">{E.venueNote}</span>}
        </div>
        <div className="fcol">
          <strong>Contato</strong>
          {telefone && <a href={`tel:+55${telefone.replace(/\D/g, '')}`}>{telefone}</a>}
          <a href="mailto:ola@semog.com.br">ola@semog.com.br</a>
          <a href="/privacidade">Política de privacidade</a>
        </div>
      </div>
      <div className="wrap">
        <div className="copy">
          © 2026 Semog Administradora de Condomínios. Todos os direitos reservados.
        </div>
      </div>
    </footer>
  )
}
