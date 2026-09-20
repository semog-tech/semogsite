/** Contrato numérico da função canônica do banco, sem dados pessoais. */
export type LotacaoExperience = {
  evento_id: string
  capacidade: number
  inscritos: number
  acompanhantes: number
  pessoas: number
}

/** Falha fechada: ausência, drift de contrato e números inválidos não liberam vaga. */
export function validarLotacaoExperience(valor: unknown): LotacaoExperience {
  if (typeof valor !== 'object' || valor === null) throw new Error('Lotação indisponível.')
  if (
    !('evento_id' in valor) ||
    typeof valor.evento_id !== 'string' ||
    !('capacidade' in valor) ||
    !('inscritos' in valor) ||
    !('acompanhantes' in valor) ||
    !('pessoas' in valor)
  ) {
    throw new Error('Contrato da lotação inválido.')
  }
  const { evento_id, capacidade, inscritos, acompanhantes, pessoas } = valor
  if (
    ![capacidade, inscritos, acompanhantes, pessoas].every(
      (n) => typeof n === 'number' && Number.isSafeInteger(n) && n >= 0,
    ) ||
    typeof capacidade !== 'number' ||
    typeof inscritos !== 'number' ||
    typeof acompanhantes !== 'number' ||
    typeof pessoas !== 'number' ||
    capacidade <= 0 ||
    pessoas !== inscritos + acompanhantes
  ) {
    throw new Error('Totais da lotação inválidos.')
  }
  return { evento_id, capacidade, inscritos, acompanhantes, pessoas }
}
