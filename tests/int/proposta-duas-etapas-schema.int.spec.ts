import { describe, expect, it } from 'vitest'
import {
  CARGO_DO_PERFIL,
  CIDADES_DAS_UNIDADES,
  dadosDaEtapa1,
  dadosDaEtapa2,
  errosPorCampo,
  etapa1Schema,
  etapa2Schema,
  formatarTelefone,
  MENSAGENS,
  propostaCompletaSchema,
} from '@/lib/propostaDuasEtapas/schema'

const etapa1 = { nomeCondominio: ' Aurora ', uf: 'PB', telefone: '(83) 99950-1388', email: '' }

function errosDe(resultado: {
  success: boolean
  error?: { issues: { path: PropertyKey[]; message: string }[] }
}) {
  return resultado.success || !resultado.error ? {} : errosPorCampo(resultado.error.issues)
}

describe('etapa 1 (spec 4.1)', () => {
  it('normaliza o telefone para E.164 e aceita e-mail vazio', () => {
    const r = etapa1Schema.safeParse(etapa1)
    expect(r.success).toBe(true)
    if (!r.success) return
    expect(dadosDaEtapa1(r.data)).toEqual({
      nomeCondominio: 'Aurora',
      uf: 'PB',
      telefone: '+5583999501388',
      variante: 'duas-etapas',
    })
  })

  it('aceita fixo com 8 dígitos e e-mail informado', () => {
    const r = etapa1Schema.safeParse({ ...etapa1, telefone: '(81) 3316-0265', email: 'a@b.com.br' })
    expect(r.success).toBe(true)
    if (!r.success) return
    expect(dadosDaEtapa1(r.data)).toMatchObject({ telefone: '+558133160265', email: 'a@b.com.br' })
  })

  it('telefone colado com +55 vira o mesmo E.164 (Review Focus)', () => {
    const r = etapa1Schema.safeParse({ ...etapa1, telefone: '+55 (83) 99950-1388' })
    expect(r.success).toBe(true)
    if (!r.success) return
    expect(r.data.telefone).toBe('+5583999501388')
  })

  it.each([
    ['', MENSAGENS.telefoneVazio],
    ['(83) 9995', MENSAGENS.telefoneIncompleto],
    ['(08) 99950-1388', MENSAGENS.telefoneDdd],
    ['0 83 99950-13880', MENSAGENS.telefoneLongo],
  ])('telefone "%s" recusa com a mensagem certa', (telefone, mensagem) => {
    expect(errosDe(etapa1Schema.safeParse({ ...etapa1, telefone })).telefone).toBe(mensagem)
  })

  it('recusa condomínio vazio, UF fora da lista e e-mail malformado, um erro por campo', () => {
    const erros = errosDe(
      etapa1Schema.safeParse({
        nomeCondominio: '  ',
        uf: 'XX',
        telefone: '(83) 99950-1388',
        email: 'sem-arroba',
      }),
    )
    expect(erros).toEqual({
      nomeCondominio: MENSAGENS.condominio,
      uf: MENSAGENS.uf,
      email: MENSAGENS.email,
    })
  })
})

describe('etapa 2 (spec 4.1 e D2)', () => {
  it('mapeia o papel para o cargo que o formulário antigo grava e guarda unidades como inteiro', () => {
    const r = etapa2Schema.safeParse({
      nome: 'Maria',
      perfil: 'construtora',
      cidade: 'Campina Grande',
      unidades: '0120',
      cliente: 'nao',
    })
    expect(r.success).toBe(true)
    if (!r.success) return
    expect(dadosDaEtapa2(r.data)).toEqual({
      nome: 'Maria',
      cargo: 'Incorporador(a) / Construtora',
      cliente: 'nao',
      cidade: 'Campina Grande',
      unidades: '120',
    })
  })

  it('unidades vazia ou zero não grava a chave; cidade vazia também não', () => {
    const r = etapa2Schema.safeParse({
      nome: 'Maria',
      perfil: 'sindico',
      cidade: '',
      unidades: '0',
      cliente: 'sim',
    })
    expect(r.success).toBe(true)
    if (!r.success) return
    expect(dadosDaEtapa2(r.data)).toEqual({ nome: 'Maria', cargo: 'Síndico(a)', cliente: 'sim' })
  })

  it('recusa sem nome, sem papel, sem resposta de cliente e com unidades não numéricas', () => {
    const erros = errosDe(
      etapa2Schema.safeParse({ nome: '', perfil: '', cidade: '', unidades: '12a', cliente: '' }),
    )
    expect(erros).toEqual({
      nome: MENSAGENS.nome,
      perfil: MENSAGENS.perfil,
      unidades: MENSAGENS.unidades,
      cliente: MENSAGENS.cliente,
    })
  })

  it('os quatro cargos são valores que o formulário antigo já usa (CARGO_OPTIONS)', () => {
    expect(Object.values(CARGO_DO_PERFIL)).toEqual([
      'Síndico(a)',
      'Conselheiro(a)',
      'Morador(a)',
      'Incorporador(a) / Construtora',
    ])
  })

  it('cidades das Unidades por UF (D2)', () => {
    expect(CIDADES_DAS_UNIDADES).toEqual({
      PE: ['Recife'],
      PB: ['João Pessoa', 'Campina Grande'],
      PA: ['Belém'],
    })
  })
})

describe('proposta completa (R5)', () => {
  it('exige os campos das duas etapas juntos', () => {
    const r = propostaCompletaSchema.safeParse({
      ...etapa1,
      nome: 'Maria',
      perfil: 'morador',
      cidade: '',
      unidades: '',
      cliente: 'nao',
    })
    expect(r.success).toBe(true)
    expect(propostaCompletaSchema.safeParse(etapa1).success).toBe(false)
  })
})

describe('máscara do telefone (protótipo)', () => {
  it.each([
    ['', ''],
    ['83', '(83'],
    ['8399', '(83) 99'],
    ['8333160265', '(83) 3316-0265'],
    ['83999501388', '(83) 99950-1388'],
  ])('%s → %s', (digitos, formatado) => expect(formatarTelefone(digitos)).toBe(formatado))
})
