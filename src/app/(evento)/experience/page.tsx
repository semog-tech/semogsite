import type { Metadata } from 'next'
import { ExperienceCta } from '@/components/experience/ExperienceCta'
import { ExperienceFooter } from '@/components/experience/ExperienceFooter'
import { ExperienceHero } from '@/components/experience/ExperienceHero'
import { ExperienceKit } from '@/components/experience/ExperienceKit'
import { ExperiencePillars } from '@/components/experience/ExperiencePillars'
import { ExperienceProgram } from '@/components/experience/ExperienceProgram'
import { ExperienceSignup } from '@/components/experience/ExperienceSignup'
import { ExperienceSponsors } from '@/components/experience/ExperienceSponsors'
import { ExperienceVideo } from '@/components/experience/ExperienceVideo'
import {
  experienceDescription,
  experienceEventJsonLd,
  experienceHeroImage,
  experienceTitle,
} from '@/lib/experienceSeo'
import { lerEstadoDaInscricao } from '@/lib/experienceVagas'
import { absoluteUrl } from '@/lib/seo'
import '@/components/experience/experience.css'

/**
 * A página deixou de ser 100% estática quando passou a fechar sozinha: o
 * estado da inscrição depende de uma contagem no banco, e um HTML gerado no
 * build ficaria preso ao número do dia do deploy.
 *
 * ISR de 60 segundos, e não consulta a cada visita: a landing recebe tráfego
 * pago e a velocidade dela é parte do custo por lead, enquanto o número de
 * inscritos muda poucas vezes por dia. O preço dessa escolha é uma janela de
 * até um minuto em que a página mostra o formulário depois da última vaga ter
 * sido tomada — e é exatamente por isso que a trava de verdade está no INSERT
 * (`gravarLead`, em `_actions/submit-form.ts`), não aqui.
 *
 * `revalidate` é o mecanismo certo neste projeto porque ele NÃO usa Cache
 * Components (`cacheComponents` não está ligado em `next.config.ts`). No modelo
 * sem Cache Components, o `revalidate` do segmento é a API estável do Next 16;
 * `'use cache'`/`cacheLife` exigem a flag, e ligá-la faria TODA rota que
 * exporta `dynamic`/`revalidate`/`fetchCache` no site passar a dar erro —
 * migração do site inteiro, não desta página. `unstable_cache` resolveria a
 * query, mas aqui não há o que memoizar por fora: a rota inteira é o que
 * precisa envelhecer junto.
 */
export const revalidate = 60

/**
 * Título, descrição, card social e JSON-LD moram em `@/lib/experienceSeo` — um
 * `page.tsx` só pode exportar o que o Next reconhece, e o que nenhum teste
 * importa nenhum teste defende. A trava do local, do horário e do número de
 * vagas vive lá.
 *
 * Virou `generateMetadata` porque o título e a descrição acompanham o estado:
 * com a inscrição fechada, o snippet da busca não pode seguir prometendo as
 * {seats} vagas para quem procurar o evento no sábado seguinte.
 */
export async function generateMetadata(): Promise<Metadata> {
  const estado = await lerEstadoDaInscricao()
  const title = experienceTitle(estado)
  const description = experienceDescription(estado)

  return {
    title,
    description,
    alternates: { canonical: absoluteUrl('experience') },
    openGraph: {
      type: 'website',
      url: absoluteUrl('experience'),
      title,
      description,
      locale: 'pt_BR',
      images: [experienceHeroImage.url],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [experienceHeroImage.url],
    },
  }
}

/**
 * Landing do Semog Experience 2026 — porte do protótipo aprovado pelo cliente
 * (`docs/superpowers/specs/2026-08-21-semog-experience-prototipo.html`), com os
 * estados ESGOTADO e ENCERRADO aprovados em 17/09/2026.
 *
 * O `.exp` do contêiner não é decorativo: `experience.css` inteiro é escopado
 * nele, porque o `theme.css` do site carrega no mesmo documento e o protótipo
 * usa nomes genéricos (`.wrap`, `.btn`, `.card`, `.hero`) e seletores de
 * elemento (`section`, `footer`, `form`).
 *
 * O `<main>` não existia no protótipo (arquivo solto, sem landmarks) e entra
 * aqui: o hero é `<header>` (banner) e o rodapé só é `contentinfo` se NÃO
 * estiver dentro de `<main>` — sem esse envelope a página não teria região
 * principal para um leitor de tela pular.
 *
 * **A seção do kit sai quando o evento acaba.** Ela é toda instrução de
 * retirada antecipada ("a partir de quarta, 23 de setembro", "não há entrega no
 * dia") — informação com prazo, que depois do sábado manda quem lê à filial
 * atrás de um kit que não existe mais. As outras seções (pilares, programação,
 * vídeo) descrevem o evento e seguem valendo como registro do que foi.
 */
export default async function ExperiencePage() {
  const estado = await lerEstadoDaInscricao()

  return (
    <>
      <script
        type="application/ld+json"
        // biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD serializado por nós, sem input de usuário
        dangerouslySetInnerHTML={{ __html: JSON.stringify(experienceEventJsonLd(estado)) }}
      />
      <div className="exp">
        <ExperienceHero estado={estado} />
        <main>
          <ExperiencePillars />
          <ExperienceProgram />
          {estado !== 'encerrado' && <ExperienceKit />}
          <ExperienceVideo />
          <ExperienceCta estado={estado} />
          <ExperienceSignup estado={estado} />
          <ExperienceSponsors estado={estado} />
        </main>
        <ExperienceFooter />
      </div>
    </>
  )
}
