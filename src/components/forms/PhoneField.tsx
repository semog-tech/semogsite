'use client'

import { AsYouType, type CountryCode } from 'libphonenumber-js/min'
import { useId, useState } from 'react'
import {
  type Control,
  Controller,
  type FieldPath,
  type FieldValues,
  type PathValue,
} from 'react-hook-form'
import { type CountryOption, CountrySelect } from '@/components/forms/CountrySelect'

/**
 * Lista curta dos países mais prováveis pros clientes da Semog (BR primeiro
 * — sempre o default). `libphonenumber-js` tem `getCountries()` com a lista
 * completa (~250 países) se um dia for preciso ampliar; um `<select>` desse
 * tamanho custaria mais em UX do que resolveria aqui.
 */
const COUNTRY_OPTIONS: CountryOption[] = [
  { code: 'BR', name: 'Brasil' },
  { code: 'PT', name: 'Portugal' },
  { code: 'US', name: 'Estados Unidos' },
  { code: 'CA', name: 'Canadá' },
  { code: 'AR', name: 'Argentina' },
  { code: 'CL', name: 'Chile' },
  { code: 'CO', name: 'Colômbia' },
  { code: 'UY', name: 'Uruguai' },
  { code: 'PY', name: 'Paraguai' },
  { code: 'BO', name: 'Bolívia' },
  { code: 'PE', name: 'Peru' },
  { code: 'MX', name: 'México' },
  { code: 'ES', name: 'Espanha' },
  { code: 'FR', name: 'França' },
  { code: 'DE', name: 'Alemanha' },
  { code: 'IT', name: 'Itália' },
  { code: 'GB', name: 'Reino Unido' },
  { code: 'IE', name: 'Irlanda' },
  { code: 'JP', name: 'Japão' },
  { code: 'CN', name: 'China' },
]

const PLACEHOLDER_BY_COUNTRY: Partial<Record<CountryCode, string>> = {
  BR: '(81) 9 0000-0000',
  PT: '912 345 678',
  US: '(201) 555-0123',
  CA: '(201) 555-0123',
}
const DEFAULT_PLACEHOLDER = 'Número de telefone'

type PhoneFieldProps<TFieldValues extends FieldValues> = {
  control: Control<TFieldValues>
  name: FieldPath<TFieldValues>
  label: string
  required?: boolean
  error?: string
  hint?: string
  className?: string
}

/**
 * Campo de telefone com seletor de país (default Brasil) + máscara
 * as-you-type via `libphonenumber-js`, no mesmo visual de `Field.tsx`
 * (label, borda, foco, erro). Entrega o valor em E.164 (`+55...`) pro RHF —
 * ver `form-schemas.ts` (`isValidPhoneNumber`) e `submit-form.ts`.
 *
 * Usa `Controller` (não `register`) porque o valor exibido (texto formatado,
 * ex.: `(81) 99999-8888`) e o valor entregue ao form (E.164) são
 * representações diferentes do mesmo dado — `register` não tem hook pra essa
 * transformação bidirecional, `Controller` sim (`field.onChange`/`field.value`
 * ficam livres pra guardar o E.164 enquanto o texto formatado vive em estado
 * local só de exibição).
 *
 * `AsYouType` é recriado a cada tecla (em vez de mantido entre renders)
 * porque ele é *stateful* e assume que só um texto por vez passa por
 * `.input()` — recriar e alimentar o valor atual do campo por completo
 * produz o mesmo resultado que digitar sequencialmente (inclusive em
 * backspace: o texto formatado anterior menos o último char continua válido
 * como entrada, já que `.input()` ignora pontuação e olha só os dígitos).
 */
export function PhoneField<TFieldValues extends FieldValues>({
  control,
  name,
  label,
  required,
  error,
  hint,
  className,
}: PhoneFieldProps<TFieldValues>) {
  const autoId = useId()
  const inputId = `${autoId}-number`
  const hintId = hint ? `${autoId}-hint` : undefined
  const errorId = error ? `${autoId}-error` : undefined
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined

  const [country, setCountry] = useState<CountryCode>('BR')
  const [nationalText, setNationalText] = useState('')

  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => {
        const applyRaw = (raw: string, forCountry: CountryCode) => {
          const formatter = new AsYouType(forCountry)
          const formatted = formatter.input(raw)
          setNationalText(formatted)
          const e164 = formatter.getNumber()?.number
          field.onChange((e164 ?? '') as PathValue<TFieldValues, FieldPath<TFieldValues>>)
        }

        return (
          <div className={`flex flex-col gap-2 ${className ?? ''}`}>
            <label htmlFor={inputId} className="text-[0.9rem] font-semibold text-fg">
              {label}
              {required && (
                <span aria-hidden="true" className="text-accent">
                  {' '}
                  *
                </span>
              )}
            </label>
            <div
              className={`flex w-full items-stretch rounded-input border bg-[rgba(10,16,46,0.6)] transition-[border-color,box-shadow] duration-[250ms] ease-out focus-within:border-ice-400 focus-within:shadow-[0_0_0_3px_rgba(173,213,235,0.18)] ${
                error ? 'border-[#E27287]' : 'border-line-strong'
              }`}
            >
              <CountrySelect
                options={COUNTRY_OPTIONS}
                value={country}
                onChange={(nextCountry) => {
                  setCountry(nextCountry)
                  applyRaw(nationalText, nextCountry)
                }}
                label="País"
              />
              <input
                id={inputId}
                ref={field.ref}
                name={field.name}
                type="tel"
                inputMode="tel"
                autoComplete="tel-national"
                placeholder={PLACEHOLDER_BY_COUNTRY[country] ?? DEFAULT_PLACEHOLDER}
                value={nationalText}
                onChange={(event) => applyRaw(event.target.value, country)}
                onBlur={field.onBlur}
                aria-invalid={!!error}
                aria-describedby={describedBy}
                className="w-full min-w-0 flex-1 rounded-r-[var(--radius-input)] bg-transparent px-[1.1rem] py-[0.9rem] font-body text-[1rem] text-fg outline-none placeholder:text-fg-3 disabled:cursor-not-allowed disabled:opacity-60"
              />
            </div>
            {hint && !error && (
              <span id={hintId} className="text-[0.82rem] text-fg-3">
                {hint}
              </span>
            )}
            {error && (
              <span id={errorId} role="alert" className="text-[0.82rem] text-[#F2A6B4]">
                {error}
              </span>
            )}
          </div>
        )
      }}
    />
  )
}
