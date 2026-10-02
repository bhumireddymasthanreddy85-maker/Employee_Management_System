import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Stack,
  TextField,
} from '@mui/material'
import { useEffect, useState } from 'react'
import type { Employee } from '../types'

export type EmployeeFormValues = Omit<Employee, 'id' | 'employee_id'>

const defaultValues: EmployeeFormValues = {
  first_name: '',
  last_name: '',
  email: '',
  phone_number: '',
  department: '',
  designation: '',
  joining_date: new Date().toISOString().slice(0, 10),
  salary: 0,
  status: 'Active',
}

const departments = [
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

const designations = [
  'Assistant Manager',
  'Associate',
  'Analyst',
  'Accountant',
  'Developer',
  'HR Manager',
  'Manager',
  'Senior Developer',
  'Senior Manager',
  'Team Lead',
]

interface EmployeeFormDialogProps {
  open: boolean
  mode: 'create' | 'edit'
  initialValues?: Partial<EmployeeFormValues>
  onClose: () => void
  onSubmit: (values: EmployeeFormValues) => Promise<void> | void
}

export function EmployeeFormDialog({
  open,
  mode,
  initialValues,
  onClose,
  onSubmit,
}: EmployeeFormDialogProps) {
  const [formValues, setFormValues] = useState<EmployeeFormValues>({
    ...defaultValues,
    ...initialValues,
  })
  const [emailError, setEmailError] = useState('')
  const [phoneNumberError, setPhoneNumberError] = useState('')

  useEffect(() => {
    setFormValues({ ...defaultValues, ...initialValues })
    setEmailError('')
    setPhoneNumberError('')
  }, [initialValues, open])

  const handleChange = (field: keyof EmployeeFormValues) => (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value
    if (field === 'email') setEmailError('')
    if (field === 'phone_number') setPhoneNumberError('')
    setFormValues((current) => ({
      ...current,
      [field]: field === 'salary' ? Number(value) : value,
    }))
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    const email = formValues.email.trim()
    const phoneNumber = formValues.phone_number
    const isValidGmail = /^[a-z0-9._%+-]+@gmail\.com$/i.test(email)
    const isValidPhoneNumber = /^[0-9]{10}$/.test(phoneNumber)

    setEmailError(isValidGmail ? '' : 'Enter a valid Gmail address (example@gmail.com).')
    setPhoneNumberError(
      isValidPhoneNumber
        ? ''
        : /[^0-9]/.test(phoneNumber)
          ? 'Only numbers are allowed.'
          : 'Enter exactly 10 digits.',
    )
    if (!isValidGmail || !isValidPhoneNumber) return

    await onSubmit({
      ...formValues,
      salary: Number(formValues.salary),
      email,
    })
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>{mode === 'create' ? 'Add Employee' : 'Edit Employee'}</DialogTitle>
      <DialogContent>
        <Stack component="form" id="employee-form" onSubmit={handleSubmit} spacing={2} sx={{ mt: 1 }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField label="First Name" value={formValues.first_name} onChange={handleChange('first_name')} required fullWidth />
            <TextField label="Last Name" value={formValues.last_name} onChange={handleChange('last_name')} required fullWidth />
          </Stack>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField
              label="Email"
              type="text"
              value={formValues.email}
              onChange={handleChange('email')}
              required
              fullWidth
              error={Boolean(emailError)}
              helperText={emailError}
              slotProps={{ htmlInput: { inputMode: 'email' } }}
            />
            <TextField
              label="Phone Number"
              value={formValues.phone_number}
              onChange={handleChange('phone_number')}
              required
              fullWidth
              error={Boolean(phoneNumberError)}
              helperText={phoneNumberError}
              slotProps={{ htmlInput: { inputMode: 'numeric', maxLength: 10 } }}
            />
          </Stack>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField
              label="Department"
              select
              value={formValues.department}
              onChange={handleChange('department')}
              required
              fullWidth
            >
              {!departments.includes(formValues.department) && formValues.department && (
                <MenuItem value={formValues.department}>{formValues.department}</MenuItem>
              )}
              {departments.map((department) => (
                <MenuItem key={department} value={department}>{department}</MenuItem>
              ))}
            </TextField>
            <TextField
              label="Designation"
              select
              value={formValues.designation}
              onChange={handleChange('designation')}
              required
              fullWidth
            >
              {!designations.includes(formValues.designation) && formValues.designation && (
                <MenuItem value={formValues.designation}>{formValues.designation}</MenuItem>
              )}
              {designations.map((designation) => (
                <MenuItem key={designation} value={designation}>{designation}</MenuItem>
              ))}
            </TextField>
          </Stack>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField
              label="Joining Date"
              type="date"
              value={formValues.joining_date}
              onChange={handleChange('joining_date')}
              required
              fullWidth
              slotProps={{ inputLabel: { shrink: true } }}
            />
            <TextField
              label="Salary"
              type="number"
              value={formValues.salary}
              onChange={handleChange('salary')}
              required
              fullWidth
              slotProps={{ htmlInput: { min: 0.01, step: 0.01 } }}
            />
          </Stack>
          <TextField
            label="Status"
            select
            value={formValues.status}
            onChange={handleChange('status')}
            required
            fullWidth
          >
            <MenuItem value="Active">Active</MenuItem>
            <MenuItem value="Inactive">Inactive</MenuItem>
          </TextField>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button type="submit" form="employee-form" variant="contained">
          {mode === 'create' ? 'Create' : 'Save'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
