import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it } from '@jest/globals'
import { EmployeeFormDialog, type EmployeeFormValues } from './EmployeeFormDialog'

describe('EmployeeFormDialog', () => {
  it('submits employee form values to its caller', async () => {
    const submittedValues: EmployeeFormValues[] = []

    render(
      <EmployeeFormDialog
        open
        mode="create"
        onClose={() => undefined}
        onSubmit={(values) => { submittedValues.push(values) }}
      />,
    )

    fireEvent.change(screen.getByRole('textbox', { name: /First Name/ }), { target: { value: 'Ada' } })
    fireEvent.change(screen.getByRole('textbox', { name: /Last Name/ }), { target: { value: 'Lovelace' } })
    fireEvent.change(screen.getByRole('textbox', { name: /Email/ }), { target: { value: 'ada@gmail.com' } })
    fireEvent.change(screen.getByRole('textbox', { name: /Phone Number/ }), { target: { value: '5550101000' } })
    fireEvent.mouseDown(screen.getByRole('combobox', { name: /Department/ }))
    fireEvent.click(screen.getByRole('option', { name: 'Engineering' }))
    fireEvent.mouseDown(screen.getByRole('combobox', { name: /Designation/ }))
    fireEvent.click(screen.getByRole('option', { name: 'Developer' }))
    fireEvent.change(screen.getByLabelText(/Joining Date/), { target: { value: '2024-01-01' } })
    fireEvent.change(screen.getByRole('spinbutton', { name: /Salary/ }), { target: { value: '50000' } })
    const form = screen.getByRole('dialog').querySelector('form')
    if (!form) {
      throw new Error('Employee form was not rendered')
    }
    fireEvent.submit(form)

    await waitFor(() => {
      expect(submittedValues).toHaveLength(1)
      expect(submittedValues[0]).toEqual(
        expect.objectContaining({
          first_name: 'Ada',
          last_name: 'Lovelace',
          email: 'ada@gmail.com',
          salary: 50000,
        }),
      )
      expect(submittedValues[0]).not.toHaveProperty('employee_id')
    })
  })

  it('shows validation errors and does not submit invalid email or phone values', async () => {
    const submittedValues: EmployeeFormValues[] = []

    render(
      <EmployeeFormDialog
        open
        mode="create"
        onClose={() => undefined}
        onSubmit={(values) => { submittedValues.push(values) }}
      />,
    )

    fireEvent.change(screen.getByRole('textbox', { name: /First Name/ }), { target: { value: 'Ada' } })
    fireEvent.change(screen.getByRole('textbox', { name: /Last Name/ }), { target: { value: 'Lovelace' } })
    fireEvent.change(screen.getByRole('textbox', { name: /Email/ }), { target: { value: 'ada@example.com' } })
    fireEvent.change(screen.getByRole('textbox', { name: /Phone Number/ }), { target: { value: '55501abc03' } })
    fireEvent.mouseDown(screen.getByRole('combobox', { name: /Department/ }))
    fireEvent.click(screen.getByRole('option', { name: 'Engineering' }))
    fireEvent.mouseDown(screen.getByRole('combobox', { name: /Designation/ }))
    fireEvent.click(screen.getByRole('option', { name: 'Developer' }))
    fireEvent.change(screen.getByLabelText(/Joining Date/), { target: { value: '2024-01-01' } })
    fireEvent.change(screen.getByRole('spinbutton', { name: /Salary/ }), { target: { value: '50000' } })
    const form = screen.getByRole('dialog').querySelector('form')
    if (!form) {
      throw new Error('Employee form was not rendered')
    }
    fireEvent.submit(form)

    expect(await screen.findByText('Enter a valid Gmail address (example@gmail.com).')).toBeTruthy()
    expect(await screen.findByText('Only numbers are allowed.')).toBeTruthy()
    expect(submittedValues).toHaveLength(0)
  })
})