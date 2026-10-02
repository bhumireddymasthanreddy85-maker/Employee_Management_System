import axios from 'axios'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  FormControl,
  FormControlLabel,
  Radio,
  RadioGroup,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { useState } from 'react'
import { authService } from '../api/services'
import type { AuthUser } from '../types'

export function AccountRegistrationPage() {
  const [role, setRole] = useState<AuthUser['role']>('user')
  const [email, setEmail] = useState('')
  const [temporaryPassword, setTemporaryPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError('')
    setSuccess('')
    setSubmitting(true)
    try {
      const account = await authService.createAccount({
        email: email.trim(),
        temporary_password: temporaryPassword,
        role,
      })
      setSuccess(`${account.role === 'admin' ? 'Admin' : 'User'} account created for ${account.email}. Share the temporary password securely.`)
      setEmail('')
      setTemporaryPassword('')
    } catch (err) {
      const responseDetail = axios.isAxiosError(err) ? err.response?.data?.detail : undefined
      setError(
        typeof responseDetail === 'string'
          ? responseDetail
          : err instanceof Error
            ? err.message
            : 'Unable to create account.',
      )
    } finally {
      setSubmitting(false)
    }
  }

  const isEmployeeAccount = role === 'user'

  return (
    <Box sx={{ maxWidth: 900, mx: 'auto' }}>
      <Stack spacing={1} sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>Account registration</Typography>
        <Typography color="text.secondary">
          Admins create accounts and assign access. There is no public self-registration.
        </Typography>
      </Stack>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

      <Card>
        <CardContent sx={{ p: { xs: 2, sm: 4 } }}>
          <Stack component="form" spacing={3} onSubmit={handleSubmit}>
            <FormControl>
              <Typography variant="h6" sx={{ mb: 1 }}>Choose an account type</Typography>
              <RadioGroup
                value={role}
                onChange={(event) => {
                  setRole(event.target.value as AuthUser['role'])
                  setError('')
                  setSuccess('')
                }}
              >
                <FormControlLabel
                  value="user"
                  control={<Radio />}
                  label={(
                    <Box>
                      <Typography fontWeight={600}>Employee User</Typography>
                      <Typography variant="body2" color="text.secondary">
                        Can sign in to view only their own employee profile.
                      </Typography>
                    </Box>
                  )}
                />
                <FormControlLabel
                  value="admin"
                  control={<Radio />}
                  label={(
                    <Box>
                      <Typography fontWeight={600}>Administrator</Typography>
                      <Typography variant="body2" color="text.secondary">
                        Can manage employee records and create accounts.
                      </Typography>
                    </Box>
                  )}
                />
              </RadioGroup>
            </FormControl>

            <TextField
              label={isEmployeeAccount ? 'Employee email address' : 'Admin email address'}
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              fullWidth
              helperText={isEmployeeAccount
                ? 'Must match the email on an existing employee record.'
                : 'This email will be used to sign in.'}
            />

            <TextField
              label="Temporary password"
              type="password"
              value={temporaryPassword}
              onChange={(event) => setTemporaryPassword(event.target.value)}
              required
              fullWidth
              inputProps={{ minLength: 8 }}
              helperText="Use at least 8 characters. Share it securely with the account holder."
            />

            <Alert severity="info">
              {isEmployeeAccount
                ? 'The account will be linked to the matching employee record. The User role cannot access other employees or administrative pages.'
                : 'Only an existing Admin can create another Admin account.'}
            </Alert>

            <Button type="submit" variant="contained" size="large" disabled={submitting}>
              {submitting ? 'Creating account...' : `Create ${isEmployeeAccount ? 'User' : 'Admin'} account`}
            </Button>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  )
}
