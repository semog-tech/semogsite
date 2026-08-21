import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components'
import { EXPERIENCE_EVENT as E } from '@/data/experienceEvent'
import { SemogMark } from './SemogMark'
import {
  bodyPaddingStyle,
  bodyStyle,
  containerStyle,
  footerStyle,
  footerTextStyle,
  NAVY_600,
  TEXT_DARK,
  TEXT_MUTED,
} from './theme'

export interface ExperienceAutoReplyProps {
  /** Nome de quem se inscreveu, para a saudação. */
  name?: string
}

/**
 * Confirmação da inscrição no Semog Experience.
 *
 * Existe porque o auto-reply genérico do site (`ContactAutoReply`) diz
 * "recebemos seu contato" e promete que *"em breve alguém vai retornar pra
 * você"* — para quem se inscreveu num evento gratuito isso é falso (ninguém
 * vai retornar; a pessoa só precisa aparecer no dia) e contradiz a própria
 * frase do formulário, "Ao se inscrever você não entra em nenhuma lista
 * comercial".
 *
 * Data, horário e local saem de `EXPERIENCE_EVENT` — mesma fonte única da
 * landing. Um e-mail com a data errada seria pior que nenhum e-mail.
 */
export default function ExperienceAutoReply({ name }: ExperienceAutoReplyProps) {
  const greeting = name ? `Olá, ${name}!` : 'Olá!'
  const linha = { color: TEXT_DARK, fontSize: '15px', lineHeight: '24px', margin: '0 0 12px' }

  return (
    <Html lang="pt-BR">
      <Head />
      <Preview>{`Inscrição recebida — Semog Experience, ${E.dateLabel}`}</Preview>
      <Body style={bodyStyle}>
        <Container style={containerStyle}>
          <SemogMark />
          <Section style={bodyPaddingStyle}>
            <Heading as="h1" style={{ fontSize: '22px', color: TEXT_DARK, margin: '0 0 16px' }}>
              Inscrição recebida
            </Heading>
            <Text style={linha}>{greeting}</Text>
            <Text style={linha}>
              Sua inscrição no <strong style={{ color: NAVY_600 }}>Semog Experience</strong> foi
              registrada. Anote na agenda — é onde a gente se encontra:
            </Text>
            <Text style={{ ...linha, margin: '0 0 20px' }}>
              <strong>
                {E.dateLabel}, {E.weekday}
              </strong>
              <br />
              Das {E.timeLabel} — chegue 15 minutos antes para o credenciamento
              <br />
              {E.venue}, {E.city} — {E.uf}
            </Text>
            <Text style={linha}>
              Leve roupa leve, garrafa de água e disposição — o resto é com a gente. O evento é{' '}
              {E.priceLabel.toLowerCase()}.
            </Text>
            <Text style={{ ...linha, color: TEXT_MUTED, margin: 0 }}>
              Você não entrou em nenhuma lista comercial: esta inscrição serve só para o evento.
            </Text>
          </Section>
          <Hr style={{ borderColor: '#e2e8f4', margin: 0 }} />
          <Section style={footerStyle}>
            <Text style={footerTextStyle}>
              Semog Administradora de Condomínios · semog.com.br
              <br />
              Este é um e-mail automático de confirmação — não é necessário responder.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}
