import { describe, expect, it } from 'vitest'
import { conteudo } from '@/site/conteudo/conteudo'
import { procurarRedacaoVedada, textosDe } from './helpers/identidade'

/** Todas as chaves de um valor, com o caminho (`a.b.0.c`). */
function chavesDe(valor: unknown, caminho = ''): string[] {
  if (Array.isArray(valor)) return valor.flatMap((v, i) => chavesDe(v, `${caminho}.${i}`))
  if (valor === null || typeof valor !== 'object') return []
  return Object.entries(valor).flatMap(([chave, v]) => [
    `${caminho}.${chave}`,
    ...chavesDe(v, `${caminho}.${chave}`),
  ])
}

describe('regras de redação do site v2 (respostas do Leandro, 16/10/2026)', () => {
  it('pegam o que devem pegar', () => {
    for (const frase of [
      'A equipe da Semog conduz a migração.',
      'Assembleia de instalação conduzida',
      'Convocação, condução e ata.',
      'A Semog Garante paga e assume a cobrança.',
      'Suporte jurídico com parceiro',
      'o produto que zera a inadimplência',
      '1% da arrecadação mensal total',
      'Fazemos a gestão de garantias da obra.',
      'https://wa.me/551130034506',
    ]) {
      expect(procurarRedacaoVedada(frase), frase).toHaveLength(1)
    }
  })

  it('deixam passar a redação aprovada', () => {
    for (const frase of [
      'A equipe da Semog assessora a migração.',
      'A cobrança é feita pela equipe própria da Semog.',
      'Suporte jurídico com escritório parceiro',
      'Quando uma administradora assume o condomínio, o síndico acompanha.',
      '1% do valor total da arrecadação',
      'O condomínio recebe 100% da arrecadação prevista.',
    ]) {
      expect(procurarRedacaoVedada(frase), frase).toEqual([])
    }
  })

  it('nenhum texto do conteúdo tipado quebra uma regra de redação', () => {
    const achados = textosDe(conteudo).flatMap((texto) =>
      procurarRedacaoVedada(texto).map((motivo) => `${motivo} → ${texto}`),
    )
    expect(achados).toEqual([])
  })

  it('as respostas do Leandro estão no conteúdo', () => {
    const { garantePagina, gestaoPagina, aSemog, comunidade, tecnologia } = conteudo
    expect(garantePagina.duvidas.itens[4].resposta).toBe(
      'Não. O Garante não tem prazo mínimo nem fidelidade: o contrato é mensal.',
    )
    expect(garantePagina.duvidas.itens[3].resposta).toContain(
      'que aparece no plano de contas como “Semog Garante”',
    )
    expect(garantePagina.abertura.fatos.custo.rotulo).toBe(
      'do valor total da arrecadação: é o custo do Garante',
    )
    expect(gestaoPagina.mesa.momentos[5].texto).toContain('cotações e orçamentos')
    expect(gestaoPagina.atende.itens[2].titulo).toBe('Acesso fácil aos sócios')
    expect(aSemog.pessoas.itens[0].titulo).toBe('Acesso fácil aos sócios')
    expect(aSemog.historia.marcos[7].texto).toBe(
      'Com a G5 Partners, criamos o produto que garante ao condomínio 100% da arrecadação prevista, por 1% do valor total da arrecadação.',
    )
    expect(comunidade.cafe.edicao).not.toContain('5ª')
    expect(comunidade.cafe.proximos).toEqual({
      rotulo: 'Próximos encontros',
      texto: 'Aguarde novas informações.',
    })
    expect(tecnologia.contexto).toBe(
      'Prestação de contas digital desde 2023. Em maio de 2026, lançamos a nova.',
    )
    expect(tecnologia.pagina.mes.momentos[1]).not.toHaveProperty('apoio')
    // Título e ênfase juntos: hoje a frase "não existe mais" mora na ênfase, não no título.
    expect(`${conteudo.naoEncontrada.titulo} ${conteudo.naoEncontrada.enfase}`).toBe(
      'Não achamos esta página.',
    )
    expect(Object.keys(conteudo.naoEncontrada.links)).not.toContain('cliente')
  })

  it('não sobra selo, WhatsApp, aviso nem moldura vazia: nenhuma dessas chaves no conteúdo', () => {
    const proibidas = chavesDe(conteudo).filter((c) =>
      /\.(confirmar|fotoConfirmar|parceirasConfirmar|whatsapp|aviso|fotoAEnviar|fotoSocios|fotoEquipe|fotoLegenda|parceiras|segundaVia)$/.test(
        c,
      ),
    )
    // `souCliente.segundaVia` é o item do painel; `contatoPagina.atalhos.segundaVia` é o atalho do
    // Contato, que fica (sem o `confirmar`) e abre direto a 2ª via.
    const permitidas = ['.souCliente.segundaVia', '.contatoPagina.atalhos.segundaVia']
    expect(proibidas.filter((c) => !permitidas.includes(c))).toEqual([])
    expect(conteudo.contatoPagina.atalhos.segundaVia).not.toHaveProperty('confirmar')
  })
})
