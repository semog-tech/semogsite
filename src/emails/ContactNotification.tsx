import {
  Body,
  Column,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Row,
  Section,
  Text,
} from '@react-email/components'
import { SemogMark } from './SemogMark'
import {
  BORDER,
  bodyPaddingStyle,
  bodyStyle,
  containerStyle,
  footerStyle,
  footerTextStyle,
  TEXT_DARK,
  TEXT_MUTED,
} from './theme'

export type ContactNotificationField = { label: string; value: string }

export interface ContactNotificationProps {
  /** Título do formulário de origem (ex.: "Fale com a Semog", "Trabalhe conosco"). */
  formTitle: string
  /** Campos submetidos, na ordem em que devem aparecer (nome, e-mail, telefone, mensagem, etc.). */
  fields: ContactNotificationField[]
  /** Origem do lead (canal, campanha, gclid…) — renderizada numa seção própria. Opcional. */
  attribution?: ContactNotificationField[]
}

const rowStyle = { borderBottom: `1px solid ${BORDER}`, verticalAlign: 'top' as const }
const labelCellStyle = { padding: '10px 0', width: '35%', verticalAlign: 'top' as const }
const valueCellStyle = { padding: '10px 0', verticalAlign: 'top' as const }
const labelTextStyle = { color: TEXT_MUTED, fontSize: '13px', fontWeight: 700, margin: 0 }
const valueTextStyle = { color: TEXT_DARK, fontSize: '14px', lineHeight: '20px', margin: 0 }

/**
 * E-mail interno enviado à equipe Semog a cada submissão de formulário —
 * lista os campos recebidos pra permitir contato rápido com o lead.
 */
export default function ContactNotification({
  formTitle,
  fields,
  attribution,
}: ContactNotificationProps) {
  return (
    <Html lang="pt-BR">
      <Head />
      <Preview>Novo contato via {formTitle}</Preview>
      <Body style={bodyStyle}>
        <Container style={containerStyle}>
          <SemogMark />
          <Section style={bodyPaddingStyle}>
            <Heading as="h1" style={{ fontSize: '20px', color: TEXT_DARK, margin: '0 0 4px' }}>
              Novo contato recebido
            </Heading>
            <Text style={{ color: TEXT_MUTED, fontSize: '14px', margin: '0 0 24px' }}>
              Formulário: <strong>{formTitle}</strong>
            </Text>
            {fields.map((field) => (
              <Row key={field.label} style={rowStyle}>
                <Column style={labelCellStyle}>
                  <Text style={labelTextStyle}>{field.label}</Text>
                </Column>
                <Column style={valueCellStyle}>
                  <Text style={valueTextStyle}>{field.value || '—'}</Text>
                </Column>
              </Row>
            ))}
            {attribution && attribution.length > 0 && (
              <>
                <Text
                  style={{
                    color: TEXT_MUTED,
                    fontSize: '13px',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    margin: '28px 0 4px',
                  }}
                >
                  Origem do lead
                </Text>
                {attribution.map((field) => (
                  <Row key={field.label} style={rowStyle}>
                    <Column style={labelCellStyle}>
                      <Text style={labelTextStyle}>{field.label}</Text>
                    </Column>
                    <Column style={valueCellStyle}>
                      <Text style={valueTextStyle}>{field.value || '—'}</Text>
                    </Column>
                  </Row>
                ))}
              </>
            )}
          </Section>
          <Hr style={{ borderColor: BORDER, margin: 0 }} />
          <Section style={footerStyle}>
            <Text style={footerTextStyle}>
              Enviado automaticamente pelo site institucional da Semog Administradora de Condomínios
              (semog.com.br). Responda diretamente ao e-mail do contato para dar seguimento.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}
