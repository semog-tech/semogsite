import { cleanup, render } from '@testing-library/react'
import { useForm } from 'react-hook-form'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ExperienceForm } from '@/components/forms/ExperienceForm'
import { Field } from '@/components/forms/Field'
import { PhoneField } from '@/components/forms/PhoneField'

vi.mock('@/app/(frontend)/_actions/submit-form', () => ({ submitForm: vi.fn() }))
vi.mock('@/components/forms/Turnstile', () => ({ Turnstile: () => null }))
afterEach(cleanup)

function PhoneFixture() {
  const { control } = useForm({ defaultValues: { telefone: '' } })
  return <PhoneField control={control} name="telefone" label="Telefone" />
}

describe('exclusão da captura RD no DOM renderizado', () => {
  it('Field protege input, select e textarea', () => {
    const { container } = render(
      <>
        <Field label="Nome" />
        <Field as="select" label="Cidade" options={[{ label: 'Recife', value: 'recife' }]} />
        <Field as="textarea" label="Mensagem" />
      </>,
    )
    const controls = container.querySelectorAll('input, select, textarea')
    expect(controls).toHaveLength(3)
    for (const control of controls) expect(control.getAttribute('data-sensitive')).toBe('true')
  })

  it('PhoneField protege o input do telefone', () => {
    const { container } = render(<PhoneFixture />)
    const input = container.querySelector('input[type="tel"]')
    expect(input).not.toBeNull()
    expect(input?.getAttribute('data-sensitive')).toBe('true')
  })

  it('ExperienceForm protege todos os cinco controles próprios', () => {
    const { container } = render(<ExperienceForm />)
    const controls = container.querySelectorAll('input, select, textarea')
    expect(controls).toHaveLength(5)
    for (const control of controls) expect(control.getAttribute('data-sensitive')).toBe('true')
  })
})
