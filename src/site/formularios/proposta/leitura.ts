import type { ChangeEvent } from 'react'
import {
  type CamposEtapa1,
  type CamposEtapa2,
  CIDADES_DAS_UNIDADES,
  digitosDoTelefone,
  errosPorCampo,
  etapa1Schema,
  etapa2Schema,
  formatarTelefone,
  MENSAGENS,
  OUTRA_CIDADE,
} from '@/lib/propostaDuasEtapas/schema'

/** Leitura e validação do formulário no navegador, com os mesmos schemas do servidor. */

export const ORDEM_ETAPA_1 = ['nomeCondominio', 'uf', 'telefone', 'email'] as const
export const ORDEM_ETAPA_2 = [
  'nome',
  'unidades',
  'cidadeEscolha',
  'cidade',
  'perfil',
  'cliente',
] as const

function texto(dados: FormData, nome: string): string {
  const valor = dados.get(nome)
  return typeof valor === 'string' ? valor : ''
}

function temLista(uf: string): boolean {
  return Boolean(CIDADES_DAS_UNIDADES[uf])
}

export function lerEtapa1(form: HTMLFormElement): CamposEtapa1 {
  const d = new FormData(form)
  return {
    nomeCondominio: texto(d, 'nomeCondominio'),
    uf: texto(d, 'uf'),
    telefone: texto(d, 'telefone'),
    email: texto(d, 'email'),
  }
}

/** A cidade que vai ao servidor: a escolhida na lista, ou o texto de "Outra cidade" (DP6). */
export function lerEtapa2(form: HTMLFormElement): CamposEtapa2 {
  const d = new FormData(form)
  const escolha = texto(d, 'cidadeEscolha')
  const usaTexto = !temLista(texto(d, 'uf')) || escolha === OUTRA_CIDADE
  return {
    nome: texto(d, 'nome'),
    perfil: texto(d, 'perfil'),
    cidade: usaTexto ? texto(d, 'cidadeOutra').trim() : escolha,
    unidades: texto(d, 'unidades'),
    cliente: texto(d, 'cliente'),
  }
}

export function errosDaEtapa1(form: HTMLFormElement): Record<string, string> {
  const r = etapa1Schema.safeParse(lerEtapa1(form))
  return r.success ? {} : errosPorCampo(r.error.issues)
}

export function errosDaEtapa2(form: HTMLFormElement): Record<string, string> {
  const d = new FormData(form)
  const r = etapa2Schema.safeParse(lerEtapa2(form))
  const erros: Record<string, string> = r.success ? {} : errosPorCampo(r.error.issues)
  if (temLista(texto(d, 'uf')) && !texto(d, 'cidadeEscolha')) erros.cidadeEscolha = MENSAGENS.cidade
  return erros
}

/** Foca o primeiro campo com erro; o erro de `cidade` aponta para o texto de "Outra cidade". */
export function focarPrimeiroErro(
  form: HTMLFormElement,
  ordem: readonly string[],
  erros: Record<string, string>,
): void {
  const campo = ordem.find((c) => erros[c])
  if (!campo) return
  const nome = campo === 'cidade' ? 'cidadeOutra' : campo
  form.querySelector<HTMLElement>(`[name="${nome}"]`)?.focus()
}

/** Máscara (00) 00000-0000; apagar sobre um separador apaga o dígito anterior (protótipo). */
export function mascararTelefone(evento: ChangeEvent<HTMLInputElement>): void {
  const input = evento.currentTarget
  // `as`: num campo de texto o onChange do React embrulha o evento `input` nativo (InputEvent);
  // em teste vem um Event sem `inputType`, e o typeof abaixo trata.
  const nativo = evento.nativeEvent as InputEvent
  const apagando = typeof nativo.inputType === 'string' && nativo.inputType.startsWith('delete')
  let d = digitosDoTelefone(input.value).slice(0, 11)
  if (apagando && d === (input.dataset.digitos ?? '')) d = d.slice(0, -1)
  input.dataset.digitos = d
  input.value = formatarTelefone(d)
}
