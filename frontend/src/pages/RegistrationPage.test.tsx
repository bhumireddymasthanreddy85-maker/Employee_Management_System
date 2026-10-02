import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, jest } from '@jest/globals'
import { MemoryRouter } from 'react-router-dom'
import { authService } from '../api/services'
import { RegistrationPage } from './RegistrationPage'

jest.mock('../api/services', () => ({
  authService: {
    registerUser: jest.fn(),
    registerAdmin: jest.fn(),
  },
}))

describe('RegistrationPage', () => {
  beforeEach(() => {
    jest.mocked(authService.registerUser).mockReset()
    jest.mocked(authService.registerAdmin).mockReset()
  })

  it('registers a User with names, email, password, and confirmation', async () => {
    jest.mocked(authService.registerUser).mockResolvedValue({
      id: 'user-1',
      email: 'john.smith@gmail.com',
      role: 'user',
    })
    render(
      <MemoryRouter>
        <RegistrationPage />
      </MemoryRouter>,
    )

    fireEvent.change(screen.getByRole('textbox', { name: 'First name' }), { target: { value: 'John' } })
    fireEvent.change(screen.getByRole('textbox', { name: 'Last name' }), { target: { value: 'Smith' } })
    fireEvent.change(screen.getByRole('textbox', { name: 'Email' }), { target: { value: 'john.smith@gmail.com' } })
    const passwords = document.querySelectorAll<HTMLInputElement>('input[type="password"]')
    fireEvent.change(passwords[0], { target: { value: 'EmployeePass456' } })
    fireEvent.change(passwords[1], { target: { value: 'EmployeePass456' } })
    fireEvent.click(screen.getByRole('button', { name: 'Register User' }))

    await waitFor(() => {
      expect(authService.registerUser).toHaveBeenCalledWith({
        first_name: 'John',
        last_name: 'Smith',
        email: 'john.smith@gmail.com',
        password: 'EmployeePass456',
        confirm_password: 'EmployeePass456',
      })
    })
    expect(await screen.findByText(/Registration complete/)).toBeTruthy()
  })

  it('shows a separate Admin registration form without password confirmation', async () => {
    jest.mocked(authService.registerAdmin).mockResolvedValue({
      id: 'admin-1',
      email: 'admin@example.com',
      role: 'admin',
    })
    render(
      <MemoryRouter>
        <RegistrationPage />
      </MemoryRouter>,
    )

    fireEvent.click(screen.getByRole('radio', { name: 'Admin registration' }))
    fireEvent.change(screen.getByRole('textbox', { name: 'Name' }), { target: { value: 'Ada Admin' } })
    fireEvent.change(screen.getByRole('textbox', { name: 'Email' }), { target: { value: 'admin@example.com' } })
    const passwords = document.querySelectorAll<HTMLInputElement>('input[type="password"]')

    expect(passwords).toHaveLength(1)
    fireEvent.change(passwords[0], { target: { value: 'AdminPass456' } })
    fireEvent.click(screen.getByRole('button', { name: 'Register Admin' }))

    await waitFor(() => {
      expect(authService.registerAdmin).toHaveBeenCalledWith({
        name: 'Ada Admin',
        email: 'admin@example.com',
        password: 'AdminPass456',
      })
    })
  })

  it('does not submit User registration when passwords do not match', async () => {
    render(
      <MemoryRouter>
        <RegistrationPage />
      </MemoryRouter>,
    )
    fireEvent.change(screen.getByRole('textbox', { name: 'First name' }), { target: { value: 'John' } })
    fireEvent.change(screen.getByRole('textbox', { name: 'Last name' }), { target: { value: 'Smith' } })
    fireEvent.change(screen.getByRole('textbox', { name: 'Email' }), { target: { value: 'john.smith@gmail.com' } })
    const passwords = document.querySelectorAll<HTMLInputElement>('input[type="password"]')
    fireEvent.change(passwords[0], { target: { value: 'EmployeePass456' } })
    fireEvent.change(passwords[1], { target: { value: 'DifferentPass456' } })
    fireEvent.click(screen.getByRole('button', { name: 'Register User' }))

    expect(await screen.findByText('Password and confirm password do not match.')).toBeTruthy()
    expect(authService.registerUser).not.toHaveBeenCalled()
  })
})
