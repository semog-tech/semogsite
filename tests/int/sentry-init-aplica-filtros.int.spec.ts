import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { OPCOES_DO_SENTRY_NO_NAVEGADOR } from '@/lib/sentryOpcoesCliente'

/**
 * A trava contra a deleção silenciosa.
 *
 * `sentry-filters.int.spec.ts` prova que o `beforeSend` **funciona**, porque
 * executa o objeto de opções da produção contra o SDK real. Sobra uma porta:
 * alguém apagar ou trocar o `Sentry.init(OPCOES_DO_SENTRY_NO_NAVEGADOR)` do
 * `src/instrumentation-client.ts`. As opções continuariam corretas, o teste
 * comportamental continuaria verde, e o navegador deixaria de aplicá-las.
 *
 * Esse arquivo não pode ser importado num teste — o import roda o `init` de
 * produção, e só o primeiro `init` do processo vale, o que transformaria o
 * `init` de qualquer teste seguinte num client mudo. Então a verificação é
 * sobre o **texto** do arquivo. É mais fraca que executá-lo: não prova que o
 * Next carrega o módulo, só que a chamada está escrita e passa a constante
 * inteira. Fecha a porta da deleção, que é o que custou caro nesta base — um
 * `export type` num módulo `'use server'` passou por build, `tsc` e 200 testes
 * e deixou a captação de leads muda por 12 dias.
 */

/**
 * Ancorado no `cwd`, e não em `import.meta.url`: sob o Vite o `import.meta.url`
 * de um arquivo de teste não é uma URL `file:`, e `fileURLToPath` rejeita. O
 * `cwd` é a raiz do projeto — `vitest.config.mts` não define `root`, então o
 * Vite adota o `cwd`, e é de lá que o script `test:int` roda. Se o caminho
 * estiver errado, o `readFileSync` lança: a falha é ruidosa, não silenciosa.
 */
const CAMINHO = join(process.cwd(), 'src', 'instrumentation-client.ts')

/**
 * O arquivo, sem `\r`.
 *
 * A máquina de desenvolvimento é Windows e o disco guarda CRLF, enquanto a CI
 * roda em Linux com LF. Um padrão ancorado em fim de linha casa num ambiente e
 * não casa no outro, em silêncio. Tirar o `\r` faz os dois verem os mesmos
 * bytes.
 */
const fonte = readFileSync(CAMINHO, 'utf8').replace(/\r/g, '')

describe('o init do navegador aplica as opções de produção', () => {
  it('importa a constante de opções do módulo que os testes exercitam', () => {
    expect(fonte).toContain(
      "import { OPCOES_DO_SENTRY_NO_NAVEGADOR } from '@/lib/sentryOpcoesCliente'",
    )
  })

  it('passa a constante inteira ao Sentry.init, sem literal nem override', () => {
    // Só espaço em branco entre os parênteses: um spread (`{...OPCOES, ... }`)
    // ou um objeto literal não casam, e é justamente por eles que uma opção
    // some sem ninguém notar.
    expect(fonte).toMatch(/Sentry\.init\(\s*OPCOES_DO_SENTRY_NO_NAVEGADOR\s*\)/)
  })

  it('não redefine filtro nenhum no arquivo do init', () => {
    for (const opcao of ['beforeSend', 'denyUrls', 'allowUrls', 'ignoreErrors']) {
      expect(fonte).not.toContain(`${opcao}:`)
    }
  })

  it('as opções de produção carregam o filtro de ruído', () => {
    // Pareado com o teste acima: lá o arquivo não pode ter a chave, aqui o
    // objeto precisa ter. Sem este par, apagar o `beforeSend` das opções
    // satisfaria os dois anteriores.
    expect(OPCOES_DO_SENTRY_NO_NAVEGADOR.beforeSend).toBeTypeOf('function')
  })
})
