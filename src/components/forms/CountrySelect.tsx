'use client'

import { type CountryCode, getCountryCallingCode } from 'libphonenumber-js/min'
import { type KeyboardEvent as ReactKeyboardEvent, useEffect, useId, useRef, useState } from 'react'

export type CountryOption = { code: CountryCode; name: string }

type CountrySelectProps = {
  options: CountryOption[]
  value: CountryCode
  onChange: (code: CountryCode) => void
  /** Nome acessível do controle — some visualmente; o botão fechado mostra só o ISO2. */
  label: string
}

/**
 * Substitui o `<select>` nativo de país (`PhoneField.tsx`) por um combobox
 * custom — padrão "Collapsible Dropdown Listbox" da WAI-ARIA APG: botão +
 * `role="listbox"`, foco real fica no próprio `<ul>` (tabIndex=-1) e a opção
 * "ativa" é só destacada via `aria-activedescendant` (evita gerenciar roving
 * tabindex por `<li>`).
 *
 * Motivo do redesign: o `<select>` exibia "Brasil +55" mesmo fechado e comia
 * ~metade do campo. Fechado, este botão mostra só o ISO2 (`BR` — sem emoji
 * de bandeira: no Windows renderiza como as 2 letras mesmo, então o texto já
 * é a versão consistente). Aberto, cada opção mostra nome completo + DDI
 * (mesma lista/ordem de `COUNTRY_OPTIONS` em `PhoneField.tsx`, BR primeiro).
 *
 * Sem portal: o painel é `position:absolute` dentro do próprio wrapper
 * (`relative`), por isso `PhoneField.tsx` teve que tirar o `overflow-hidden`
 * do container do campo (senão o painel seria cortado ao abrir) — os cantos
 * arredondados que dependiam daquele corte agora vêm de `rounded-l`/
 * `rounded-r` explícitos no botão e no `<input>` de número. Também evita o
 * problema de portal-quebra-`:focus-within` (o anel de foco do container
 * some se o elemento focado sai da árvore do DOM do campo).
 */
export function CountrySelect({ options, value, onChange, label }: CountrySelectProps) {
  const autoId = useId()
  const buttonId = `${autoId}-button`
  const labelId = `${autoId}-label`
  const listboxId = `${autoId}-listbox`
  const optionId = (index: number) => `${autoId}-option-${index}`

  const selectedIndex = Math.max(
    0,
    options.findIndex((option) => option.code === value),
  )

  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(selectedIndex)

  const rootRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const listboxRef = useRef<HTMLDivElement>(null)
  const optionRefs = useRef<(HTMLDivElement | null)[]>([])
  const typeahead = useRef<{ text: string; timer: ReturnType<typeof setTimeout> | null }>({
    text: '',
    timer: null,
  })

  const selected = options[selectedIndex] ?? options[0]

  function openList() {
    setActiveIndex(selectedIndex)
    setOpen(true)
  }

  function closeList(returnFocus = true) {
    setOpen(false)
    if (returnFocus) buttonRef.current?.focus()
  }

  function commit(index: number) {
    const option = options[index]
    if (option) onChange(option.code)
    closeList()
  }

  // Fecha ao clicar fora do controle (botão + painel — sem portal, ambos
  // vivem dentro de `rootRef`).
  useEffect(() => {
    if (!open) return
    function handlePointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('pointerdown', handlePointerDown)
    return () => document.removeEventListener('pointerdown', handlePointerDown)
  }, [open])

  // Move o foco real pro <ul> ao abrir (fechar devolve pro botão — closeList).
  useEffect(() => {
    if (open) listboxRef.current?.focus()
  }, [open])

  // Mantém a opção ativa visível ao navegar por teclado/typeahead.
  useEffect(() => {
    if (open) optionRefs.current[activeIndex]?.scrollIntoView({ block: 'nearest' })
  }, [open, activeIndex])

  function handleButtonKeyDown(event: ReactKeyboardEvent<HTMLButtonElement>) {
    if (
      event.key === 'ArrowDown' ||
      event.key === 'ArrowUp' ||
      event.key === 'Enter' ||
      event.key === ' '
    ) {
      event.preventDefault()
      openList()
    }
  }

  /** Type-ahead (equivalente ao de um `<select>` nativo): digitar letras pula pra
   *  próxima opção cujo nome começa com o texto acumulado; reinicia após 600ms. */
  function handleTypeahead(char: string) {
    const state = typeahead.current
    if (state.timer) clearTimeout(state.timer)
    state.text += char.toLowerCase()
    state.timer = setTimeout(() => {
      state.text = ''
    }, 600)
    const query = state.text
    const searchFrom = (start: number) =>
      options.findIndex(
        (option, index) => index >= start && option.name.toLowerCase().startsWith(query),
      )
    // Uma letra só (primeiro toque da janela): busca a partir da PRÓXIMA opção,
    // pra repetir a letra ciclar entre todas com aquela inicial.
    const startIndex = query.length === 1 ? activeIndex + 1 : activeIndex
    const match = searchFrom(startIndex)
    const index = match >= 0 ? match : searchFrom(0)
    if (index >= 0) setActiveIndex(index)
  }

  function handleListKeyDown(event: ReactKeyboardEvent<HTMLDivElement>) {
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault()
        setActiveIndex((index) => Math.min(options.length - 1, index + 1))
        break
      case 'ArrowUp':
        event.preventDefault()
        setActiveIndex((index) => Math.max(0, index - 1))
        break
      case 'Home':
        event.preventDefault()
        setActiveIndex(0)
        break
      case 'End':
        event.preventDefault()
        setActiveIndex(options.length - 1)
        break
      case 'Enter':
      case ' ':
        event.preventDefault()
        commit(activeIndex)
        break
      case 'Escape':
        event.preventDefault()
        closeList()
        break
      case 'Tab':
        // Não trava o Tab: só fecha o painel e deixa o navegador seguir a
        // ordem natural de foco (não devolve foco ao botão).
        closeList(false)
        break
      default:
        if (event.key.length === 1 && /[a-z0-9]/i.test(event.key)) {
          event.preventDefault()
          handleTypeahead(event.key)
        }
    }
  }

  return (
    <div ref={rootRef} className="relative shrink-0 border-r border-line-strong">
      <span id={labelId} className="sr-only">
        {label}
      </span>
      <button
        ref={buttonRef}
        id={buttonId}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listboxId}
        aria-labelledby={`${labelId} ${buttonId}`}
        onClick={() => (open ? closeList() : openList())}
        onKeyDown={handleButtonKeyDown}
        className="flex h-full w-[68px] items-center justify-center gap-1 rounded-l-[var(--radius-input)] px-[0.5rem] py-[0.9rem] font-body text-[0.92rem] font-semibold text-fg outline-none transition-colors hover:bg-white/5 focus-visible:bg-white/5"
      >
        <span>{selected.code}</span>
        <svg
          aria-hidden="true"
          width="10"
          height="6"
          viewBox="0 0 10 6"
          fill="none"
          className={`shrink-0 text-fg-3 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        >
          <path
            d="M1 1l4 4 4-4"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
      {open && (
        // `div`, não `ul`/`li`: o lint a11y do Biome (`noNoninteractiveElementToInteractiveRole`)
        // não aceita role interativo (`listbox`/`option`) em elemento semântico não-interativo
        // como `ul`/`li` — `div`/`span` (sem role implícito) é a sugestão oficial da própria regra.
        <div
          ref={listboxRef}
          id={listboxId}
          role="listbox"
          tabIndex={-1}
          aria-labelledby={labelId}
          aria-activedescendant={optionId(activeIndex)}
          onKeyDown={handleListKeyDown}
          className="absolute left-0 top-[calc(100%+0.5rem)] z-20 max-h-[280px] w-[260px] overflow-y-auto rounded-input border border-line-strong bg-navy-900 py-1 shadow-[0_24px_60px_-24px_rgba(5,8,26,0.7)] outline-none"
        >
          {options.map((option, index) => {
            const isActive = index === activeIndex
            const isSelected = option.code === value
            return (
              <div
                key={option.code}
                id={optionId(index)}
                ref={(node) => {
                  optionRefs.current[index] = node
                }}
                role="option"
                aria-selected={isSelected}
                // `tabIndex={-1}`: focalizável programaticamente (nunca alcançado via Tab — o
                // foco real fica sempre no container, ver `aria-activedescendant` acima), só pra
                // satisfazer `useFocusableInteractive`. `onKeyDown` aqui é o mesmo motivo (regra
                // `useKeyWithClickEvents`) — na prática quem trata Enter/Espaço é `handleListKeyDown`
                // no container, que tem o foco de verdade; isto é só um espelho defensivo.
                tabIndex={-1}
                onPointerEnter={() => setActiveIndex(index)}
                onClick={() => commit(index)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault()
                    commit(index)
                  }
                }}
                className={`flex cursor-pointer items-baseline justify-between gap-3 px-[0.9rem] py-[0.5rem] text-[0.9rem] ${
                  isActive ? 'bg-ice-400/15 text-fg' : 'text-fg-2'
                } ${isSelected ? 'font-semibold' : ''}`}
              >
                <span>{option.name}</span>
                <span className="shrink-0 text-fg-3">+{getCountryCallingCode(option.code)}</span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
