import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, jest } from '@jest/globals'
import { authService } from '../api/services'
import { AccountRegistrationPage } from './AccountRegistrationPage'

jest.mock('../api/services', () => ({
  authService: {
    createAccount: jest.fn(),
    registerUser: jest.fn(),
    registerAdmin: jest.fn(),
  },
}))

describe('AccountRegistrationPage', () => {
  it('creates an employee user account using an existing employee email', async () => {
    jest.mocked(authService.createAccount).mockResolvedValue({
      id: 'user-1',
      email: 'employee@gmail.com',
      role: 'user',
    })

    render(<AccountRegistrationPage />)
    fireEvent.change(screen.getByRole('textbox', { name: 'Employee email address' }), {
      target: { value: 'employee@gmail.com' },
    })
    const temporaryPassword = document.querySelector<HTMLInputElement>('input[type="password"]')
    if (!temporaryPassword) {
      throw new Error('Temporary password input was not rendered')
    }
    fireEvent.change(temporaryPassword, {
      target: { value: 'TemporaryPass123' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Create User account' }))

    await waitFor(() => {
      expect(authService.createAccount).toHaveBeenCalledWith({
        email: 'employee@gmail.com',
        temporary_password: 'TemporaryPass123',
        role: 'user',
      })
    })
    expect(await screen.findByText(/User account created for employee@gmail.com/)).toBeTruthy()
  })

  it('shows the separate administrator account design when selected', () => {
    render(<AccountRegistrationPage />)
    fireEvent.click(screen.getByRole('radio', { name: /Administrator/ }))

    expect(screen.getByRole('textbox', { name: 'Admin email address' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Create Admin account' })).toBeTruthy()
    expect(screen.getByText('Only an existing Admin can create another Admin account.')).toBeTruthy()
  })
})
