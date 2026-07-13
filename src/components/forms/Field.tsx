'use client'

import type {
  InputHTMLAttributes,
  ReactNode,
  Ref,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from 'react'
import { forwardRef, useId } from 'react'

type SelectOption = { label: string; value: string }

type SharedProps = {
  label: string
  error?: string
  hint?: string
  className?: string
}

type InputVariant = SharedProps &
  Omit<InputHTMLAttributes<HTMLInputElement>, 'className'> & { as?: 'input' }

type TextareaVariant = SharedProps &
  Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'className'> & { as: 'textarea' }

type SelectVariant = SharedProps &
  Omit<SelectHTMLAttributes<HTMLSelectElement>, 'className' | 'placeholder'> & {
    as: 'select'
    options: SelectOption[]
    /** Vira a primeira `<option value="">`, não um atributo HTML `placeholder` (selects não têm). */
    placeholder?: string
  }

export type FieldProps = InputVariant | TextareaVariant | SelectVariant

/**
 * Fiel a `.field`/`.field input,select,textarea` (`_reference/assets/css/semog.css:358-378`),
 * portado pros tokens Tailwind (Task 1): fundo escuro, borda `line-strong`,
 * `radius-input`, foco em `ice-400` com halo, erro em rosa. `has-error` do
 * ref vira `aria-invalid` + texto de erro sempre visível (não `display:none`
 * condicional) — mais simples de auditar e já nativamente acessível.
 */
const controlClass =
  'w-full rounded-input border border-line-strong bg-[rgba(10,16,46,0.6)] px-[1.1rem] py-[0.9rem] font-body text-[1rem] text-fg outline-none transition-[border-color,box-shadow] duration-[250ms] ease-out placeholder:text-fg-3 focus:border-ice-400 focus:shadow-[0_0_0_3px_rgba(173,213,235,0.18)] disabled:cursor-not-allowed disabled:opacity-60 aria-invalid:border-[#E27287]'

export const Field = forwardRef<
  HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement,
  FieldProps
>(function Field(props, ref) {
  const autoId = useId()
  const id = props.id ?? autoId
  const hintId = props.hint ? `${id}-hint` : undefined
  const errorId = props.error ? `${id}-error` : undefined
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined

  let control: ReactNode
  if (props.as === 'textarea') {
    const { label, error, hint, className, as, id: _id, ...rest } = props
    control = (
      <textarea
        id={id}
        ref={ref as Ref<HTMLTextAreaElement>}
        className={controlClass}
        aria-invalid={!!error}
        aria-describedby={describedBy}
        {...rest}
      />
    )
  } else if (props.as === 'select') {
    const { label, error, hint, className, as, id: _id, options, placeholder, ...rest } = props
    control = (
      <select
        id={id}
        ref={ref as Ref<HTMLSelectElement>}
        className={controlClass}
        aria-invalid={!!error}
        aria-describedby={describedBy}
        {...rest}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    )
  } else {
    const { label, error, hint, className, as, id: _id, ...rest } = props
    control = (
      <input
        id={id}
        ref={ref as Ref<HTMLInputElement>}
        className={controlClass}
        aria-invalid={!!error}
        aria-describedby={describedBy}
        {...rest}
      />
    )
  }

  return (
    <div className={`flex flex-col gap-2 ${props.className ?? ''}`}>
      <label htmlFor={id} className="text-[0.9rem] font-semibold text-fg">
        {props.label}
        {props.required && (
          <span aria-hidden="true" className="text-accent">
            {' '}
            *
          </span>
        )}
      </label>
      {control}
      {props.hint && !props.error && (
        <span id={hintId} className="text-[0.82rem] text-fg-3">
          {props.hint}
        </span>
      )}
      {props.error && (
        <span id={errorId} role="alert" className="text-[0.82rem] text-[#F2A6B4]">
          {props.error}
        </span>
      )}
    </div>
  )
})
