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
  ALERTA_BG,
  ALERTA_BORDA,
  ALERTA_TEXTO,
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
  /**
   * Presente quando a gravação em `cms.leads` falhou ou não pôde ser
   * confirmada (falha técnica do banco): o que quem recebe precisa fazer à mão,
   * uma frase por item. O e-mail pode ser o único registro do lead, e o alerta
   * vai no topo para não ser lido como um contato comum.
   */
  naoGravado?: string[]
}

const alertaStyle = {
  backgroundColor: ALERTA_BG,
  border: `1px solid ${ALERTA_BORDA}`,
  borderRadius: '8px',
  margin: '0 0 24px',
  padding: '16px 20px',
}
const alertaTextoStyle = { color: ALERTA_TEXTO, fontSize: '14px', lineHeight: '20px', margin: 0 }

/** O bloco de alerta do lead não gravado — ver `naoGravado`. */
function AlertaNaoGravado({ itens }: { itens: string[] }) {
  return (
    <Section style={alertaStyle}>
      <Text style={{ ...alertaTextoStyle, fontSize: '16px', fontWeight: 700, margin: '0 0 8px' }}>
        GRAVAÇÃO NÃO CONFIRMADA — conferir no banco
      </Text>
      {itens.map((item) => (
        <Text key={item} style={{ ...alertaTextoStyle, margin: '0 0 6px' }}>
          {item}
        </Text>
      ))}
    </Section>
  )
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
  naoGravado,
}: ContactNotificationProps) {
  const prefixo = naoGravado ? 'GRAVAÇÃO NÃO CONFIRMADA — ' : ''
  return (
    <Html lang="pt-BR">
      <Head />
      <Preview>
        {prefixo}Novo contato via {formTitle}
      </Preview>
      <Body style={bodyStyle}>
        <Container style={containerStyle}>
          <SemogMark />
          <Section style={bodyPaddingStyle}>
            {naoGravado && <AlertaNaoGravado itens={naoGravado} />}
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
