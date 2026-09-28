import { readFileSync, writeFileSync } from 'node:fs'
import sharp from 'sharp'

/**
 * Rasteriza `src/app/icon.svg` em PNG 180x180 para o `apple-icon` (o Safari
 * ignora SVG em apple-touch-icon). Rodar de novo só quando a marca mudar —
 * o PNG é versionado, não é gerado no build.
 *
 * O `flatten` não é detalhe: o `icon.svg` tem `rx`, então rasterizar direto
 * deixa os quatro cantos transparentes. No apple-touch-icon isso sai errado
 * duas vezes — o iOS já recorta o ícone com o raio dele (cantos arredondados
 * em cima de cantos arredondados) e pinta de preto o que estiver transparente.
 * Achatando sobre a própria cor de fundo do SVG o PNG vira o quadrado sólido
 * que o iOS espera, sem duplicar o arredondamento.
 */
const svg = readFileSync('src/app/icon.svg', 'utf8')

// A cor sai do próprio SVG pra não dessincronizar quando a marca mudar.
const fundo = svg.match(/<rect[^>]*\brx="[^"]*"[^>]*\bfill="([^"]+)"/)?.[1]
if (!fundo) {
  throw new Error(
    'não achei o fill do rect de fundo em src/app/icon.svg — o apple-icon precisa dele',
  )
}

const png = await sharp(Buffer.from(svg), { density: 720 })
  .resize(180, 180)
  .flatten({ background: fundo })
  .png()
  .toBuffer()
writeFileSync('src/app/apple-icon.png', png)
console.log(`apple-icon.png gerado (${Math.round(png.length / 1024)} KB, fundo ${fundo})`)
