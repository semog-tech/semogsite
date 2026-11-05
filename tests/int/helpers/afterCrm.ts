const tarefas: Array<() => unknown> = []

export function agendarAfterCrm(tarefa: () => unknown): void {
  tarefas.push(tarefa)
}

export async function rodarAfterCrm(): Promise<void> {
  for (const tarefa of tarefas.splice(0)) await tarefa()
}

export function limparAfterCrm(): void {
  tarefas.length = 0
}
