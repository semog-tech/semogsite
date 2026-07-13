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
import { SemogMark } from './SemogMark'
import {
  bodyPaddingStyle,
  bodyStyle,
  containerStyle,
  footerStyle,
  footerTextStyle,
  NAVY_600,
  TEXT_DARK,
} from './theme'

export interface ContactAutoReplyProps {
  /** Primeiro nome (ou nome completo) do lead, quando disponível — usado na saudação. */
  name?: string
}

/**
 * Confirmação automática enviada ao lead após submeter um formulário no
 * site — reforça a marca Semog e define expectativa de retorno.
 */
export default function ContactAutoReply({ name }: ContactAutoReplyProps) {
  const greeting = name ? `Olá, ${name}!` : 'Olá!'

  return (
    <Html lang="pt-BR">
      <Head />
      <Preview>Recebemos seu contato — Semog Administradora de Condomínios</Preview>
      <Body style={bodyStyle}>
        <Container style={containerStyle}>
          <SemogMark />
          <Section style={bodyPaddingStyle}>
            <Heading as="h1" style={{ fontSize: '22px', color: TEXT_DARK, margin: '0 0 16px' }}>
              Recebemos seu contato
            </Heading>
            <Text
              style={{ color: TEXT_DARK, fontSize: '15px', lineHeight: '24px', margin: '0 0 12px' }}
            >
              {greeting}
            </Text>
            <Text
              style={{ color: TEXT_DARK, fontSize: '15px', lineHeight: '24px', margin: '0 0 12px' }}
            >
              Obrigado por entrar em contato com a Semog Administradora de Condomínios. Sua mensagem
              já chegou até nossa equipe e em breve alguém vai retornar pra você.
            </Text>
            <Text style={{ color: TEXT_DARK, fontSize: '15px', lineHeight: '24px', margin: 0 }}>
              Enquanto isso, fica o nosso lema:{' '}
              <strong style={{ color: NAVY_600 }}>
                &ldquo;Preocupe-se apenas em morar.&rdquo;
              </strong>
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
