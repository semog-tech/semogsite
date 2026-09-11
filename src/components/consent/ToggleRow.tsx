'use client'

/**
 * Linha de um interruptor de categoria de cookie: rótulo, explicação e o
 * switch. Nasceu no painel de Preferências do banner de rodapé (removido em
 * 11/09/2026) e ficou: é a peça que o controle da Política de Privacidade usa.
 *
 * `role="switch"` + `aria-checked` em vez de `<input type="checkbox">` porque o
 * visual é um trilho deslizante, não uma caixa; o leitor de tela anuncia
 * "ativado/desativado" do mesmo jeito.
 */
export function ToggleRow({
  label,
  description,
  checked,
  disabled,
  onChange,
}: {
  label: string
  description: string
  checked: boolean
  disabled?: boolean
  onChange?: (value: boolean) => void
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="text-[0.9rem] font-medium text-fg">{label}</p>
        <p className="text-[0.82rem] text-fg-3">{description}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        onClick={() => onChange?.(!checked)}
        className={`relative h-6 w-11 shrink-0 rounded-pill border transition-colors duration-200 motion-reduce:transition-none ${
          checked ? 'border-ice-400 bg-ice-400' : 'border-line-strong bg-navy-800'
        } ${disabled ? 'cursor-not-allowed opacity-60' : ''}`}
      >
        {/*
          `left-0` não é decorativo. Sem ele o botão não tem posição horizontal
          declarada, e o navegador usa a POSIÇÃO ESTÁTICA — que num `<button>`
          é o centro, porque o UA stylesheet aplica `text-align: center`. O
          deslocamento de 22px então partia do meio do trilho e jogava a
          bolinha inteira para fora dele: medido em 1366x768, o trilho
          terminava em x=830 e a bolinha ia de 830 a 850. Vinha assim desde o
          painel de Preferências do antigo banner, onde ninguém tinha olhado.
        */}
        <span
          aria-hidden="true"
          className={`absolute top-0.5 left-0 h-5 w-5 rounded-full bg-white transition-transform duration-200 motion-reduce:transition-none ${
            checked ? 'translate-x-5' : 'translate-x-0.5'
          }`}
        />
      </button>
    </div>
  )
}
