import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Grid,
  Stack,
  Typography,
} from '@mui/material'
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { employeeService } from '../api/services'
import { EmployeeFormDialog, type EmployeeFormValues } from '../components/EmployeeFormDialog'
import type { Employee } from '../types'

const formatSalary = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
})

export function EmployeeDetailsPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [employee, setEmployee] = useState<Employee | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)

  const loadEmployee = async () => {
    if (!id) return
    try {
      setLoading(true)
      const data = await employeeService.getEmployeeById(id)
      setEmployee(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load employee details.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadEmployee()
  }, [id])

  const handleDelete = async () => {
    if (!employee || !window.confirm('Delete this employee?')) {
      return
    }

    try {
      await employeeService.deleteEmployee(employee.id)
      navigate('/employees')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete employee.')
    }
  }

  const handleSubmit = async (values: EmployeeFormValues) => {
    if (!employee) return
    try {
      await employeeService.updateEmployee(employee.id, { ...values, email: values.email.trim() })
      setDialogOpen(false)
      await loadEmployee()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update employee.')
    }
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 6 }}>
        <CircularProgress />
      </Box>
    )
  }

  if (error || !employee) {
    return <Alert severity="error">{error || 'Employee not found.'}</Alert>
  }

  return (
    <Box>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 3, justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' } }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700 }}>
            {employee.first_name} {employee.last_name}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {employee.designation} • {employee.department}
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <Button variant="outlined" onClick={() => navigate('/employees')}>
            Back
          </Button>
          <Button variant="contained" onClick={() => setDialogOpen(true)}>
            Edit
          </Button>
          <Button color="error" variant="outlined" onClick={handleDelete}>
            Delete
          </Button>
        </Stack>
      </Stack>

      <Card>
        <CardContent>
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 6 }}>
              <Typography variant="subtitle2" color="text.secondary">Employee ID</Typography>
              <Typography variant="body1">{employee.employee_id}</Typography>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <Typography variant="subtitle2" color="text.secondary">Status</Typography>
              <Typography variant="body1">{employee.status}</Typography>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <Typography variant="subtitle2" color="text.secondary">Email</Typography>
              <Typography variant="body1">{employee.email}</Typography>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <Typography variant="subtitle2" color="text.secondary">Phone Number</Typography>
              <Typography variant="body1">{employee.phone_number}</Typography>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <Typography variant="subtitle2" color="text.secondary">Joining Date</Typography>
              <Typography variant="body1">{employee.joining_date}</Typography>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <Typography variant="subtitle2" color="text.secondary">Salary</Typography>
              <Typography variant="body1">{formatSalary.format(employee.salary)}</Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <EmployeeFormDialog
        open={dialogOpen}
        mode="edit"
        initialValues={{
          first_name: employee.first_name,
          last_name: employee.last_name,
          email: employee.email,
          phone_number: employee.phone_number,
          department: employee.department,
          designation: employee.designation,
          joining_date: employee.joining_date,
          salary: employee.salary,
          status: employee.status,
        }}
        onClose={() => setDialogOpen(false)}
        onSubmit={handleSubmit}
      />
    </Box>
  )
}
