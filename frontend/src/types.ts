export type EmployeeStatus = 'Active' | 'Inactive'

export interface Employee {
  id: string
  employee_id: string
  first_name: string
  last_name: string
  email: string
  phone_number: string
  department: string
  designation: string
  joining_date: string
  salary: number
  status: EmployeeStatus
}

export type EmployeeInput = Omit<Employee, 'id' | 'employee_id'>

export interface EmployeePage {
  items: Employee[]
  total: number
  page: number
  limit: number
}

export interface DashboardStats {
  total_employees: number
  active_employees: number
  inactive_employees: number
}

export interface AuthUser {
  id: string
  email: string
  role: 'admin' | 'user'
  must_change_password?: boolean
}

export interface AuthResponse {
  access_token: string
  token_type: string
  user: AuthUser
}

export interface AccountCreateInput {
  email: string
  temporary_password: string
  role: AuthUser['role']
}

export interface UserRegistrationInput {
  first_name: string
  last_name: string
  email: string
  password: string
  confirm_password: string
}

export interface AdminRegistrationInput {
  name: string
  email: string
  password: string
}

export interface AccountCreated {
  id: string
  email: string
  role: AuthUser['role']
}
