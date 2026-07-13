/**
 * Paleta compartilhada dos templates de e-mail (`src/lib/sendgrid.ts` consome
 * `src/emails/*`). Mesmos tons de `src/lib/og.tsx`/`src/styles/theme.css`
 * (`--color-navy-*`/`--color-ice-*`), repetidos aqui — e não importados de
 * `og.tsx` — porque clientes de e-mail exigem estilo inline por elemento;
 * não há como reaproveitar CSS de página num `<table>` renderizado pelo
 * Gmail/Outlook.
 */
export const NAVY_950 = '#05081a'
export const NAVY_900 = '#0a102e'
export const NAVY_600 = '#1b2d70'
export const ICE_300 = '#d8ecf7'
export const ICE_400 = '#add5eb'
export const TEXT_LIGHT = '#edf1fa'
export const TEXT_DARK = '#1c2333'
export const TEXT_MUTED = '#5b6478'
export const BORDER = '#e2e8f4'
export const BODY_BG = '#f4f6fb'

export const bodyStyle = {
  backgroundColor: BODY_BG,
  fontFamily: 'Helvetica, Arial, sans-serif',
  margin: 0,
  padding: 0,
}

export const containerStyle = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  maxWidth: '560px',
  borderRadius: '12px',
  overflow: 'hidden',
  border: `1px solid ${BORDER}`,
}

export const headerStyle = {
  backgroundColor: NAVY_900,
  padding: '28px 32px',
}

export const barStyle = {
  display: 'inline-block',
  width: '10px',
  height: '26px',
  backgroundColor: ICE_400,
  borderRadius: '2px',
  marginRight: '6px',
}

export const bodyPaddingStyle = {
  padding: '32px',
}

export const footerStyle = {
  padding: '20px 32px 32px',
}

export const footerTextStyle = {
  color: TEXT_MUTED,
  fontSize: '12px',
  lineHeight: '18px',
  margin: 0,
}
