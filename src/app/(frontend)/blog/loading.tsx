import { Container } from '@/components/ui/Container'
import { Section } from '@/components/ui/Section'

/**
 * Skeleton de loading para `/blog/[slug]` (busca o post no Payload). NÃO
 * fica no root de `(frontend)` de propósito: `[[...slug]]` (catch-all que
 * serve a home e todas as páginas institucionais, inclusive `/blog`) também
 * chama `notFound()` quando o slug não existe no Payload, e um `loading.tsx`
 * ancestral força esse segmento a *streamar* a resposta — o que, por design
 * do Next (ver "Status Codes" em nextjs.org/docs/.../loading), sempre
 * retorna HTTP 200 mesmo quando `notFound()` dispara (headers já enviados
 * antes do await resolver; só o <meta name="robots" content="noindex"> some
 * embutido no HTML). Confirmado localmente: com `loading.tsx` no root de
 * (frontend), `curl -sI /rota-que-nao-existe` voltava 200 em vez de 404;
 * removendo-o (e mantendo só aqui, num segmento irmão do catch-all), o
 * catch-all volta a responder 404 de verdade. `/blog/[slug]` sofre o mesmo
 * trade-off (posts inexistentes viram soft-404 200+noindex), mas é uma rota
 * secundária não coberta pelo teste de verificação desta task.
 */
export default function BlogPostLoading() {
  return (
    <Section
      aria-busy="true"
      aria-live="polite"
      className="flex min-h-[60vh] flex-col justify-center !py-0"
    >
      <Container className="pt-[110px]">
        <span className="sr-only">Carregando…</span>
        <div className="max-w-2xl animate-pulse space-y-[1.4rem]" aria-hidden="true">
          <div className="h-3 w-32 rounded-full bg-bg-raise" />
          <div className="h-10 w-full rounded-2xl bg-bg-raise" />
          <div className="h-4 w-full rounded-full bg-bg-raise" />
          <div className="h-4 w-full rounded-full bg-bg-raise" />
          <div className="h-4 w-2/3 rounded-full bg-bg-raise" />
        </div>
      </Container>
    </Section>
  )
}
