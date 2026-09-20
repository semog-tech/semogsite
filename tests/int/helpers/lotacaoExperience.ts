/** Resposta padrão do banco para testes de formulários que não investigam a lotação. */
export function respostaComLotacao(sql: string, id: string) {
  if (/experience_lotacao/.test(sql)) {
    return {
      rows: [
        {
          evento_id: '65e40d0c-890c-490e-8c7b-b31f45adf6f8',
          capacidade: 150,
          inscritos: 1,
          acompanhantes: 0,
          pessoas: 1,
        },
      ],
      rowCount: 1,
    }
  }
  return { rows: [{ id }], rowCount: 1 }
}
