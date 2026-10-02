import { api } from './client'
import type {
  AccountCreateInput,
  AccountCreated,
  AdminRegistrationInput,
  AuthResponse,
  DashboardStats,
  Employee,
  EmployeeInput,
  EmployeePage,
  UserRegistrationInput,
} from '../types'

export type EmployeeSortOrder = 'employee_id_asc' | 'employee_id_desc' | 'name_asc' | 'salary_desc'

export const authService = {
  login: async (email: string, password: string) => {
    const response = await api.post<AuthResponse>('/api/auth/login', { email, password })
    return response.data
  },
  createAccount: async (account: AccountCreateInput) => {
    const response = await api.post<AccountCreated>('/api/admin/accounts', account)
    return response.data
  },
  registerUser: async (account: UserRegistrationInput) => {
    const response = await api.post<AccountCreated>('/api/auth/register/user', account)
    return response.data
  },
  registerAdmin: async (account: AdminRegistrationInput) => {
    const response = await api.post<AccountCreated>('/api/auth/register/admin', account)
    return response.data
  },
  changePassword: async (currentPassword: string, newPassword: string) => {
    const response = await api.post<{ message: string }>('/api/auth/change-password', {
      current_password: currentPassword,
      new_password: newPassword,
    })
    return response.data
  },
}

export const employeeService = {
  getDepartments: async () => {
    const response = await api.get<string[]>('/api/employees/departments')
    return response.data
  },
  getDashboardStats: async () => {
    const response = await api.get<DashboardStats>('/api/dashboard/stats')
    return response.data
  },
  getEmployees: async (params?: {
    search?: string
    department?: string
    status?: string
    sort_by?: EmployeeSortOrder
    page?: number
    limit?: number
  }) => {
    const queryParams = Object.fromEntries(
      Object.entries(params ?? {}).filter(([, value]) => value !== '' && value !== undefined),
    )
    const response = await api.get<EmployeePage>('/api/employees', { params: queryParams })
    return response.data
  },
  getEmployeeById: async (id: string) => {
    const response = await api.get<Employee>(`/api/employees/${id}`)
    return response.data
  },
  getMyEmployee: async () => {
    const response = await api.get<Employee>('/api/employees/me')
    return response.data
  },
  createEmployee: async (employee: EmployeeInput) => {
    const response = await api.post<Employee>('/api/employees', employee)
    return response.data
  },
  updateEmployee: async (id: string, employee: EmployeeInput) => {
    const response = await api.put<Employee>(`/api/employees/${id}`, employee)
    return response.data
  },
  deleteEmployee: async (id: string) => {
    await api.delete(`/api/employees/${id}`)
  },
}
