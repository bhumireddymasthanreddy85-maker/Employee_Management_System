import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { describe, expect, it, jest } from '@jest/globals'
import { MemoryRouter } from 'react-router-dom'
import { employeeService } from '../api/services'
import type { Employee } from '../types'
import { EmployeesPage } from './EmployeesPage'

jest.mock('../api/services', () => ({
  employeeService: {
    getDepartments: jest.fn(),
    getEmployees: jest.fn(),
    createEmployee: jest.fn(),
    updateEmployee: jest.fn(),
    deleteEmployee: jest.fn(),
    getDashboardStats: jest.fn(),
    getEmployeeById: jest.fn(),
  },
  authService: { login: jest.fn() },
}))

const employee = (id: string, firstName: string): Employee => ({
  id,
  employee_id: `EMP-${id}`,
  first_name: firstName,
  last_name: 'Example',
  email: `${firstName.toLowerCase()}@gmail.com`,
  phone_number: '5550101000',
  department: 'Engineering',
  designation: 'Developer',
  joining_date: '2024-01-01',
  salary: 75000,
  status: 'Active',
})

describe('EmployeesPage', () => {
  it('requests and displays the selected server-side page', async () => {
    const getEmployees = jest.mocked(employeeService.getEmployees)
    jest.mocked(employeeService.getDepartments).mockResolvedValue(['Engineering'])
    getEmployees
      .mockResolvedValueOnce({ items: [employee('1', 'Ada')], total: 11, page: 1, limit: 10 })
      .mockResolvedValueOnce({ items: [employee('11', 'Grace')], total: 11, page: 2, limit: 10 })

    render(
      <MemoryRouter>
        <EmployeesPage />
      </MemoryRouter>,
    )

    expect(await screen.findByText('Ada Example')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Go to page 2' }))

    expect(await screen.findByText('Grace Example')).toBeTruthy()
    await waitFor(() => {
      expect(getEmployees).toHaveBeenLastCalledWith(
        expect.objectContaining({ page: 2, limit: 10 }),
      )
    })
  })

  it('submits edited employee data when the Save button is clicked', async () => {
    const existingEmployee = employee('1', 'Ada')
    jest.mocked(employeeService.getDepartments).mockResolvedValue(['Engineering', 'Operations'])
    jest.mocked(employeeService.getEmployees).mockResolvedValue({
      items: [existingEmployee],
      total: 1,
      page: 1,
      limit: 10,
    })
    jest.mocked(employeeService.updateEmployee).mockResolvedValue({
      ...existingEmployee,
      department: 'Operations',
      salary: 80000,
    })

    render(
      <MemoryRouter>
        <EmployeesPage />
      </MemoryRouter>,
    )

    expect(await screen.findByText('Ada Example')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Edit' }))
    fireEvent.mouseDown(screen.getByRole('combobox', { name: 'Department' }))
    fireEvent.click(screen.getByRole('option', { name: 'Operations' }))
    fireEvent.change(screen.getByRole('spinbutton', { name: /Salary/ }), {
      target: { value: '80000' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))

    await waitFor(() => {
      expect(employeeService.updateEmployee).toHaveBeenCalledWith(
        '1',
        expect.objectContaining({ department: 'Operations', salary: 80000 }),
      )
    })
  })

  it('applies a status filter from the URL', async () => {
    jest.mocked(employeeService.getDepartments).mockResolvedValue(['Engineering'])
    jest.mocked(employeeService.getEmployees).mockResolvedValue({
      items: [],
      total: 0,
      page: 1,
      limit: 10,
    })

    render(
      <MemoryRouter initialEntries={['/employees?status=Inactive']}>
        <EmployeesPage />
      </MemoryRouter>,
    )

    await waitFor(() => {
      expect(employeeService.getEmployees).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'Inactive', page: 1, limit: 10 }),
      )
    })
  })

  it('requests server-side sorting and displays salary in Indian rupees', async () => {
    const getEmployees = jest.mocked(employeeService.getEmployees)
    jest.mocked(employeeService.getDepartments).mockResolvedValue(['Engineering'])
    getEmployees.mockResolvedValue({
      items: [{ ...employee('1', 'Ada'), salary: 75000 }],
      total: 1,
      page: 1,
      limit: 10,
    })

    render(
      <MemoryRouter>
        <EmployeesPage />
      </MemoryRouter>,
    )

    expect(await screen.findByText('₹75,000')).toBeTruthy()
    fireEvent.mouseDown(screen.getAllByRole('combobox')[2])
    fireEvent.click(await screen.findByRole('option', { name: 'Salary: Highest to lowest' }))

    await waitFor(() => {
      expect(getEmployees).toHaveBeenLastCalledWith(
        expect.objectContaining({ sort_by: 'salary_desc', page: 1 }),
      )
    })
  })

  it('opens the create dialog from the dashboard quick action URL', async () => {
    jest.mocked(employeeService.getDepartments).mockResolvedValue(['Engineering'])
    jest.mocked(employeeService.getEmployees).mockResolvedValue({
      items: [],
      total: 0,
      page: 1,
      limit: 10,
    })

    render(
      <MemoryRouter initialEntries={['/employees?action=create']}>
        <EmployeesPage />
      </MemoryRouter>,
    )

    const dialog = await screen.findByRole('dialog')
    expect(within(dialog).getByRole('heading', { name: 'Add Employee' })).toBeTruthy()
  })
})