import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, jest } from '@jest/globals'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { AuthProvider } from '../context/AuthContext'
import { ProtectedRoute } from './ProtectedRoute'

jest.mock('../api/services', () => ({
  authService: { login: () => Promise.reject(new Error('Login is not used in this test')) },
}))

function renderProtectedRoute(initialPath = '/employees', roles?: ('admin' | 'user')[]) {
  return render(
    <AuthProvider>
      <MemoryRouter initialEntries={[initialPath]}>
        <Routes>
          <Route
            path="/employees"
            element={
              <ProtectedRoute roles={roles}>
                <p>Employee records</p>
              </ProtectedRoute>
            }
          />
          <Route path="/login" element={<p>Login page</p>} />
          <Route path="/my-profile" element={<p>My profile</p>} />
          <Route path="/change-password" element={<p>Change password</p>} />
        </Routes>
      </MemoryRouter>
    </AuthProvider>,
  )
}

describe('ProtectedRoute', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('redirects unauthenticated users to login', () => {
    renderProtectedRoute()

    expect(screen.getByText('Login page')).toBeTruthy()
    expect(screen.queryByText('Employee records')).toBeNull()
  })

  it('renders protected content for authenticated users', () => {
    localStorage.setItem('employee_token', 'test-token')
    localStorage.setItem('employee_user', JSON.stringify({ id: '1', email: 'admin@example.com', role: 'admin' }))

    renderProtectedRoute()

    expect(screen.getByText('Employee records')).toBeTruthy()
  })

  it('redirects users away from administrator routes to their own profile', () => {
    localStorage.setItem('employee_token', 'test-token')
    localStorage.setItem('employee_user', JSON.stringify({ id: '1', email: 'user@example.com', role: 'user' }))

    renderProtectedRoute('/employees', ['admin'])

    expect(screen.getByText('My profile')).toBeTruthy()
    expect(screen.queryByText('Employee records')).toBeNull()
  })

  it('requires accounts with temporary passwords to change them before continuing', () => {
    localStorage.setItem('employee_token', 'test-token')
    localStorage.setItem('employee_user', JSON.stringify({
      id: '1',
      email: 'user@example.com',
      role: 'user',
      must_change_password: true,
    }))

    renderProtectedRoute('/employees')

    expect(screen.getByText('Change password')).toBeTruthy()
    expect(screen.queryByText('Employee records')).toBeNull()
  })
})