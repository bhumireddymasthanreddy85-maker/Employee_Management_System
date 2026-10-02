import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, jest } from '@jest/globals'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { employeeService } from '../api/services'
import { DashboardPage } from './DashboardPage'

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

function CurrentLocation() {
  const location = useLocation()
  return <p>{`${location.pathname}${location.search}`}</p>
}

describe('DashboardPage', () => {
  const mockDashboardData = () => {
    jest.mocked(employeeService.getDashboardStats).mockResolvedValue({
      total_employees: 2,
      active_employees: 1,
      inactive_employees: 1,
    })
    jest.mocked(employeeService.getEmployees).mockResolvedValue({
      items: [],
      total: 0,
      page: 1,
      limit: 5,
    })
  }

  it('renders total, active, and inactive employee statistics', async () => {
    jest.mocked(employeeService.getDashboardStats).mockResolvedValue({
      total_employees: 24,
      active_employees: 20,
      inactive_employees: 4,
    })
    jest.mocked(employeeService.getEmployees).mockResolvedValue({
      items: [],
      total: 0,
      page: 1,
      limit: 5,
    })

    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>,
    )

    expect(await screen.findByText('24')).toBeTruthy()
    expect(screen.getByText('Total employees')).toBeTruthy()
    expect(screen.getAllByText('20').length).toBeGreaterThan(0)
    expect(screen.getAllByText('4').length).toBeGreaterThan(0)
  })

  it('opens the employee directory filtered to Active from the KPI card', async () => {
    mockDashboardData()

    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/employees" element={<CurrentLocation />} />
        </Routes>
      </MemoryRouter>,
    )

    fireEvent.click(await screen.findByRole('button', { name: 'View active' }))

    expect(screen.getByText('/employees?status=Active')).toBeTruthy()
  })

  it('opens the create-employee flow from the Add employee action', async () => {
    mockDashboardData()

    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/employees" element={<CurrentLocation />} />
        </Routes>
      </MemoryRouter>,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Add employee' }))

    expect(screen.getByText('/employees?action=create')).toBeTruthy()
  })
})