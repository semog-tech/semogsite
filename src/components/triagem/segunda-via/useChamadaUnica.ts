import { useCallback, useEffect, useRef, useState } from 'react'
import type { TelaSegundaVia } from './estado'

type Tratadores<T> = {
  aoResponder: (resultado: T) => void
  /** A action lançou (rede, deploy no meio do fluxo). */
  aoFalhar: (erro: unknown) => void
}

/**
 * Uma chamada de Server Action por vez, presa à tela que a fez.
 *
 * Cada troca de tela abre uma "geração" nova. Uma resposta que volta numa
 * geração velha (a pessoa clicou em Voltar, ou fechou a triagem) é
 * descartada: clique duplo ou resposta lenta nunca levam a uma tela que a
 * pessoa já deixou. Dentro da mesma geração, só uma chamada fica em voo.
 *
 * `aoDescartarFechado` roda quando a resposta chega com a triagem já fechada:
 * um "ok" atrasado pode ter gravado cookie de desafio/sessão depois do
 * encerramento.
 */
export function useChamadaUnica(tela: TelaSegundaVia, aoDescartarFechado: () => void) {
  const geracao = useRef(0)
  const emVoo = useRef<number | null>(null)
  const montado = useRef(true)
  const [ocupado, setOcupado] = useState(false)

  // `tela` é gatilho de re-execução: cada tela nova é uma geração nova.
  // biome-ignore lint/correctness/useExhaustiveDependencies: gatilho de re-execução, ver acima
  useEffect(() => {
    geracao.current += 1
    emVoo.current = null
    setOcupado(false)
  }, [tela])

  useEffect(() => {
    montado.current = true
    return () => {
      montado.current = false
      geracao.current += 1
    }
  }, [])

  const chamar = useCallback(
    async <T>(acao: () => Promise<T>, { aoResponder, aoFalhar }: Tratadores<T>) => {
      const minha = geracao.current
      if (emVoo.current === minha) return
      emVoo.current = minha
      setOcupado(true)
      try {
        const resultado = await acao()
        if (minha === geracao.current) aoResponder(resultado)
        else if (!montado.current) aoDescartarFechado()
      } catch (erro) {
        if (minha === geracao.current) aoFalhar(erro)
        else console.error('[segunda-via] chamada descartada falhou:', erro)
      } finally {
        if (emVoo.current === minha) {
          emVoo.current = null
          if (montado.current) setOcupado(false)
        }
      }
    },
    [aoDescartarFechado],
  )

  return { chamar, ocupado }
}
