import {
  Alert,
  Box,
  Card,
  CardContent,
  CircularProgress,
  Grid,
  Stack,
  Typography,
} from '@mui/material'
import { useEffect, useState } from 'react'
import { employeeService } from '../api/services'
import type { Employee } from '../types'

const formatSalary = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
})

export function MyProfilePage() {
  const [employee, setEmployee] = useState<Employee | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    employeeService.getMyEmployee()
      .then((profile) => {
        if (active) setEmployee(profile)
      })
      .catch((err: unknown) => {
        if (active) {
          setError(err instanceof Error ? err.message : 'Unable to load your employee profile.')
        }
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  if (loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', p: 6 }}><CircularProgress /></Box>
  }

  if (error || !employee) {
    return <Alert severity="error">{error || 'Your employee profile could not be found.'}</Alert>
  }

  const profileFields: [string, string][] = [
    ['Employee ID', employee.employee_id],
    ['Email', employee.email],
    ['Phone number', employee.phone_number],
    ['Department', employee.department],
    ['Designation', employee.designation],
    ['Joining date', employee.joining_date],
    ['Salary', formatSalary.format(employee.salary)],
    ['Status', employee.status],
  ]

  return (
    <Box sx={{ maxWidth: 900, mx: 'auto' }}>
      <Stack spacing={0.5} sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>My profile</Typography>
        <Typography color="text.secondary">
          Your employee information is view-only. Contact an administrator if it needs to be changed.
        </Typography>
      </Stack>
      <Card>
        <CardContent sx={{ p: { xs: 2, sm: 4 } }}>
          <Typography variant="h5" sx={{ fontWeight: 650, mb: 3 }}>
            {employee.first_name} {employee.last_name}
          </Typography>
          <Grid container spacing={3}>
            {profileFields.map(([label, value]) => (
              <Grid key={label} size={{ xs: 12, sm: 6 }}>
                <Typography variant="subtitle2" color="text.secondary">{label}</Typography>
                <Typography variant="body1">{value}</Typography>
              </Grid>
            ))}
          </Grid>
        </CardContent>
      </Card>
    </Box>
  )
}
