import {
  Alert,
  Box,
  Button,
  Card,
  CircularProgress,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Pagination,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { employeeService, type EmployeeSortOrder } from '../api/services'
import { EmployeeFormDialog, type EmployeeFormValues } from '../components/EmployeeFormDialog'
import type { Employee } from '../types'

const pageSize = 10
const standardDepartments = [
  'Administration',
  'Customer Support',
  'Engineering',
  'Finance',
  'Human Resources',
  'IT',
  'Legal',
  'Marketing',
  'Operations',
  'Sales',
]

const sortOrders: EmployeeSortOrder[] = [
  'employee_id_asc',
  'employee_id_desc',
  'name_asc',
  'salary_desc',
]

const formatSalary = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
})

export function EmployeesPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [department, setDepartment] = useState('')
  const [status, setStatus] = useState(searchParams.get('status') ?? '')
  const [departmentOptions, setDepartmentOptions] = useState<string[]>([])
  const [sortBy, setSortBy] = useState<EmployeeSortOrder>('employee_id_asc')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create')
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null)

  const loadEmployees = async () => {
    try {
      setLoading(true)
      const data = await employeeService.getEmployees({
        search,
        department,
        status,
        sort_by: sortBy,
        page,
        limit: pageSize,
      })

      setEmployees(data.items)
      const pageCount = Math.max(1, Math.ceil(data.total / pageSize))
      setTotalPages(pageCount)
      if (page > pageCount) {
        setPage(pageCount)
        return
      }
      setError('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load employees.')
    } finally {
      setLoading(false)
    }
  }

  const loadDepartments = async () => {
    try {
      setDepartmentOptions(await employeeService.getDepartments())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load departments.')
    }
  }

  useEffect(() => {
    void loadEmployees()
  }, [search, department, status, sortBy, page])

  useEffect(() => {
    void loadDepartments()
  }, [])

  useEffect(() => {
    if (searchParams.get('action') !== 'create') return

    setSelectedEmployee(null)
    setDialogMode('create')
    setDialogOpen(true)
    const nextParams = new URLSearchParams(searchParams)
    nextParams.delete('action')
    setSearchParams(nextParams, { replace: true })
  }, [searchParams, setSearchParams])

  const handlePageChange = (_event: React.ChangeEvent<unknown>, value: number) => {
    setPage(value)
  }

  const openCreateDialog = () => {
    setSelectedEmployee(null)
    setDialogMode('create')
    setDialogOpen(true)
  }

  const openEditDialog = (employee: Employee) => {
    setSelectedEmployee(employee)
    setDialogMode('edit')
    setDialogOpen(true)
  }

  const handleSubmit = async (values: EmployeeFormValues) => {
    try {
      const payload = {
        ...values,
        salary: Number(values.salary),
        email: values.email.trim(),
      }

      if (dialogMode === 'create') {
        await employeeService.createEmployee(payload)
      } else if (selectedEmployee) {
        await employeeService.updateEmployee(selectedEmployee.id, payload)
      }

      setDialogOpen(false)
      setSelectedEmployee(null)
      await loadDepartments()
      await loadEmployees()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save employee.')
    }
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this employee?')) {
      return
    }

    try {
      await employeeService.deleteEmployee(id)
      await loadEmployees()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete employee.')
    }
  }

  const employeeRows = useMemo(() => employees, [employees])

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Box>
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mb: 3, justifyContent: 'space-between', alignItems: { xs: 'stretch', md: 'center' } }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700 }}>
            Employees
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage employee profiles and status
          </Typography>
        </Box>
        <Button variant="contained" onClick={openCreateDialog}>
          Add Employee
        </Button>
      </Stack>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Card sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} sx={{ alignItems: 'center' }}>
          <Grid size={{ xs: 12, md: 4 }}>
            <TextField
              fullWidth
              label="Search by name or email"
              value={search}
              onChange={(event) => {
                setPage(1)
                setSearch(event.target.value)
              }}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 2.5 }}>
            <FormControl fullWidth>
              <InputLabel>Department</InputLabel>
              <Select
                label="Department"
                value={department}
                onChange={(event) => {
                  setPage(1)
                  setDepartment(event.target.value)
                }}
              >
                <MenuItem value="">All</MenuItem>
                {[...new Set([...standardDepartments, ...departmentOptions])].sort().map((option) => (
                  <MenuItem key={option} value={option}>
                    {option}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, md: 2 }}>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                label="Status"
                value={status}
                onChange={(event) => {
                  setPage(1)
                  setStatus(event.target.value)
                }}
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="Active">Active</MenuItem>
                <MenuItem value="Inactive">Inactive</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, md: 2.5 }}>
            <FormControl fullWidth>
              <InputLabel>Sort by</InputLabel>
              <Select<EmployeeSortOrder>
                label="Sort by"
                value={sortBy}
                onChange={(event) => {
                  const value = event.target.value
                  if (!sortOrders.includes(value as EmployeeSortOrder)) return
                  setPage(1)
                  setSortBy(value as EmployeeSortOrder)
                }}
              >
                <MenuItem value="employee_id_asc">Employee ID: A-Z</MenuItem>
                <MenuItem value="employee_id_desc">Employee ID: Z-A</MenuItem>
                <MenuItem value="name_asc">Name: A-Z</MenuItem>
                <MenuItem value="salary_desc">Salary: Highest to lowest</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, md: 1 }}>
            <Button variant="outlined" fullWidth onClick={() => {
              setSearch('')
              setDepartment('')
              setStatus('')
              setSortBy('employee_id_asc')
              setPage(1)
            }}>
              Reset
            </Button>
          </Grid>
        </Grid>
      </Card>

      <Card>
        <TableContainer sx={{ overflowX: 'auto' }}>
        <Table sx={{ minWidth: 820 }}>
          <TableHead>
            <TableRow>
              <TableCell>Employee ID</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Department</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Salary</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {employeeRows.length > 0 ? (
              employeeRows.map((employee) => (
                <TableRow key={employee.id} hover>
                  <TableCell>{employee.employee_id}</TableCell>
                  <TableCell>
                    <Button color="primary" onClick={() => navigate(`/employees/${employee.id}`)}>
                      {employee.first_name} {employee.last_name}
                    </Button>
                  </TableCell>
                  <TableCell>{employee.email}</TableCell>
                  <TableCell>{employee.department}</TableCell>
                  <TableCell>{employee.status}</TableCell>
                  <TableCell>{formatSalary.format(employee.salary)}</TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={1}>
                      <Button size="small" variant="outlined" onClick={() => openEditDialog(employee)}>
                        Edit
                      </Button>
                      <Button size="small" color="error" variant="outlined" onClick={() => handleDelete(employee.id)}>
                        Delete
                      </Button>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                  No employees found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        </TableContainer>
      </Card>

      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
        <Pagination count={totalPages} page={page} onChange={handlePageChange} color="primary" />
      </Box>

      <EmployeeFormDialog
        open={dialogOpen}
        mode={dialogMode}
        initialValues={selectedEmployee ? {
          first_name: selectedEmployee.first_name,
          last_name: selectedEmployee.last_name,
          email: selectedEmployee.email,
          phone_number: selectedEmployee.phone_number,
          department: selectedEmployee.department,
          designation: selectedEmployee.designation,
          joining_date: selectedEmployee.joining_date ?? new Date().toISOString().slice(0, 10),
          salary: selectedEmployee.salary,
          status: selectedEmployee.status,
        } : undefined}
        onClose={() => setDialogOpen(false)}
        onSubmit={handleSubmit}
      />
    </Box>
  )
}
