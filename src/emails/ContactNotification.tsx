import {
  Body,
  Button,
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
import type { BotaoDeDesfecho } from '@/lib/desfecho'
import { SemogMark } from './SemogMark'
import {
  BORDER,
  bodyPaddingStyle,
  bodyStyle,
  containerStyle,
  footerStyle,
  footerTextStyle,
  NAVY_600,
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
   * Botões de desfecho do lead (`botoesDeDesfecho`, em `@/lib/desfechoToken`).
   * Ausente = seção não aparece — é o que acontece quando não há
   * `LEAD_OUTCOME_SECRET` configurado. Botão que leva a um link que ninguém
   * consegue validar é pior que botão nenhum.
   */
  desfecho?: BotaoDeDesfecho[]
}

const rowStyle = { borderBottom: `1px solid ${BORDER}`, verticalAlign: 'top' as const }
const labelCellStyle = { padding: '10px 0', width: '35%', verticalAlign: 'top' as const }
const valueCellStyle = { padding: '10px 0', verticalAlign: 'top' as const }
const labelTextStyle = { color: TEXT_MUTED, fontSize: '13px', fontWeight: 700, margin: 0 }
const valueTextStyle = { color: TEXT_DARK, fontSize: '14px', lineHeight: '20px', margin: 0 }

/**
 * Botão de desfecho. Empilhado (`display: block`), e não quatro numa linha:
 * cliente de e-mail não tem flexbox confiável, e quatro colunas viram quatro
 * palavras espremidas no celular — que é onde o responsável da praça lê.
 */
const desfechoButtonStyle = {
  display: 'block',
  backgroundColor: NAVY_600,
  borderRadius: '8px',
  color: '#ffffff',
  fontSize: '15px',
  fontWeight: 700,
  marginBottom: '8px',
  padding: '12px 20px',
  textAlign: 'center' as const,
  textDecoration: 'none',
}

/**
 * E-mail interno enviado à equipe Semog a cada submissão de formulário —
 * lista os campos recebidos pra permitir contato rápido com o lead.
 */
export default function ContactNotification({
  formTitle,
  fields,
  attribution,
  desfecho,
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
            {desfecho && desfecho.length > 0 && (
              <>
                <Hr style={{ borderColor: BORDER, margin: '28px 0 20px' }} />
                <Text
                  style={{ color: TEXT_DARK, fontSize: '15px', fontWeight: 700, margin: '0 0 4px' }}
                >
                  Depois de falar com o contato, diga no que deu:
                </Text>
                <Text style={{ color: TEXT_MUTED, fontSize: '13px', margin: '0 0 16px' }}>
                  O botão abre uma página de confirmação — nada é registrado só por clicar, e dá
                  para mudar a resposta depois.
                </Text>
                {desfecho.map((botao) => (
                  <Button key={botao.status} href={botao.url} style={desfechoButtonStyle}>
                    {botao.rotulo}
                  </Button>
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
