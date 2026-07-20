import { Button } from '@/components/ui/Button'
import { Container } from '@/components/ui/Container'
import { GradientText } from '@/components/ui/GradientText'
import { Section } from '@/components/ui/Section'

export const metadata = {
  title: 'Página não encontrada — Semog',
}

/**
 * 404 da (frontend) — pega qualquer `notFound()` disparado por
 * `[[...slug]]/page.tsx` (slug sem página publicada no Payload) e qualquer
 * outra rota não casada dentro do grupo. Renderiza dentro do root layout do
 * grupo (`(frontend)/layout.tsx`), então Header/Footer seguem montados.
 */
export default function NotFound() {
  return (
    <Section className="flex min-h-dvh flex-col items-center justify-center !py-0 text-center">
      <Container className="pt-[110px]">
        <p className="mb-[1rem] text-[0.78rem] font-semibold uppercase tracking-[0.16em] text-ice-500">
          Erro 404
        </p>
        <h1 className="mx-auto mb-[1.4rem] max-w-2xl text-[clamp(2.6rem,6.2vw,5.2rem)] tracking-normal">
          Página não <GradientText>encontrada</GradientText>
        </h1>
        <p className="mx-auto mb-[2.2rem] max-w-[46ch] text-lead text-fg-2">
          O endereço pode ter mudado ou nunca existiu. Volte para a página inicial e continue por
          lá.
        </p>
        <Button href="/" variant="primary" size="lg" withArrow>
          Voltar para o início
        </Button>
      </Container>
    </Section>
  )
}
