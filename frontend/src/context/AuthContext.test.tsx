import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, jest } from '@jest/globals'
import { AuthProvider, useAuth } from './AuthContext'
import { AUTH_EXPIRED_EVENT } from './authEvents'

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

function AuthState() {
  const { isAuthenticated, sessionExpired } = useAuth()
  return (
    <>
      <p>{isAuthenticated ? 'Authenticated' : 'Signed out'}</p>
      {sessionExpired && <p>Session expired</p>}
    </>
  )
}

describe('AuthProvider', () => {
  it('clears stale credentials when an API request reports an expired session', async () => {
    localStorage.setItem('employee_token', 'expired-token')
    localStorage.setItem('employee_user', JSON.stringify({ id: 'admin', email: 'admin@company.com' }))

    render(
      <AuthProvider>
        <AuthState />
      </AuthProvider>,
    )

    expect(screen.getByText('Authenticated')).toBeTruthy()
    fireEvent(window, new Event(AUTH_EXPIRED_EVENT))

    expect(await screen.findByText('Session expired')).toBeTruthy()
    expect(screen.getByText('Signed out')).toBeTruthy()
    expect(localStorage.getItem('employee_token')).toBeNull()
    expect(localStorage.getItem('employee_user')).toBeNull()
  })
})