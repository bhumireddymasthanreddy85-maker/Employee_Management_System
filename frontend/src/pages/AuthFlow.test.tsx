import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, jest } from '@jest/globals'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { Layout } from '../components/Layout'
import { ProtectedRoute } from '../components/ProtectedRoute'
import { AuthProvider } from '../context/AuthContext'
import { AUTH_EXPIRED_EVENT } from '../context/authEvents'
import { authService } from '../api/services'
import { LoginPage } from './LoginPage'

jest.mock('../api/services', () => ({
  authService: { login: jest.fn() },
  employeeService: {
    getDashboardStats: jest.fn(),
    getDepartments: jest.fn(),
    getEmployees: jest.fn(),
    getEmployeeById: jest.fn(),
    createEmployee: jest.fn(),
    updateEmployee: jest.fn(),
    deleteEmployee: jest.fn(),
  },
}))

describe('authentication flow', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('logs in and stores the JWT and user', async () => {
    jest.mocked(authService.login).mockResolvedValue({
      access_token: 'test-token',
      token_type: 'bearer',
      user: { id: 'admin-id', email: 'admin@company.com', role: 'admin' },
    })

    render(
      <AuthProvider>
        <MemoryRouter initialEntries={['/login']}>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/" element={<p>Dashboard home</p>} />
          </Routes>
        </MemoryRouter>
      </AuthProvider>,
    )

    expect(screen.queryByText(/Demo credentials:/)).toBeNull()
    fireEvent.change(screen.getByRole('textbox', { name: 'Email' }), {
      target: { value: 'admin@company.com' },
    })
    const passwordInput = document.querySelector<HTMLInputElement>('input[type="password"]')
    if (!passwordInput) {
      throw new Error('Password input was not rendered')
    }
    fireEvent.change(passwordInput, {
      target: { value: 'admin123' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Login' }))

    expect(await screen.findByText('Dashboard home')).toBeTruthy()
    expect(localStorage.getItem('employee_token')).toBe('test-token')
    expect(JSON.parse(localStorage.getItem('employee_user') ?? '{}').email).toBe('admin@company.com')
  })

  it('links unauthenticated users to the separate registration page', () => {
    render(
      <AuthProvider>
        <MemoryRouter initialEntries={['/login']}>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
          </Routes>
        </MemoryRouter>
      </AuthProvider>,
    )

    expect(screen.getByRole('link', { name: 'Create an account' })).toBeTruthy()
  })

  it('clears credentials and navigates to login on logout', async () => {
    localStorage.setItem('employee_token', 'test-token')
    localStorage.setItem('employee_user', JSON.stringify({ id: 'admin-id', email: 'admin@company.com' }))

    render(
      <AuthProvider>
        <MemoryRouter initialEntries={['/app']}>
          <Routes>
            <Route path="/app" element={<Layout />}>
              <Route index element={<p>Private home</p>} />
            </Route>
            <Route path="/login" element={<p>Login screen</p>} />
          </Routes>
        </MemoryRouter>
      </AuthProvider>,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Logout' }))

    expect(await screen.findByText('Login screen')).toBeTruthy()
    expect(localStorage.getItem('employee_token')).toBeNull()
    expect(localStorage.getItem('employee_user')).toBeNull()
  })

  it('redirects an expired session to login and explains why', async () => {
    localStorage.setItem('employee_token', 'expired-token')
    localStorage.setItem('employee_user', JSON.stringify({ id: 'admin-id', email: 'admin@company.com' }))

    render(
      <AuthProvider>
        <MemoryRouter initialEntries={['/employees']}>
          <Routes>
            <Route
              path="/employees"
              element={<ProtectedRoute><p>Private employee records</p></ProtectedRoute>}
            />
            <Route path="/login" element={<LoginPage />} />
          </Routes>
        </MemoryRouter>
      </AuthProvider>,
    )

    fireEvent(window, new Event(AUTH_EXPIRED_EVENT))

    expect(await screen.findByText('Your session expired. Please sign in again.')).toBeTruthy()
    expect(screen.queryByText('Private employee records')).toBeNull()
    expect(localStorage.getItem('employee_token')).toBeNull()
  })
})