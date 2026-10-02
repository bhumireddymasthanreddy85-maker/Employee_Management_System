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
import { Link as RouterLink } from 'react-router-dom'
import { authService } from '../api/services'

type RegistrationRole = 'user' | 'admin'

export function RegistrationPage() {
  const [role, setRole] = useState<RegistrationRole>('user')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [adminName, setAdminName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleRoleChange = (nextRole: RegistrationRole) => {
    setRole(nextRole)
    setError('')
    setSuccess('')
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError('')
    setSuccess('')
    if (role === 'user' && password !== confirmPassword) {
      setError('Password and confirm password do not match.')
      return
    }

    setSubmitting(true)
    try {
      if (role === 'user') {
        await authService.registerUser({
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          email: email.trim(),
          password,
          confirm_password: confirmPassword,
        })
      } else {
        await authService.registerAdmin({
          name: adminName.trim(),
          email: email.trim(),
          password,
        })
      }
      setSuccess('Registration complete. You can now sign in with your email and password.')
      setFirstName('')
      setLastName('')
      setAdminName('')
      setEmail('')
      setPassword('')
      setConfirmPassword('')
    } catch (err) {
      const responseDetail = axios.isAxiosError(err) ? err.response?.data?.detail : undefined
      setError(
        typeof responseDetail === 'string'
          ? responseDetail
          : err instanceof Error
            ? err.message
            : 'Registration failed. Please try again.',
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        px: 2,
        py: 4,
        background: 'linear-gradient(135deg, #eef4ff 0%, #f6f8ff 100%)',
      }}
    >
      <Card sx={{ width: 560, maxWidth: '100%', p: 1, borderRadius: 3 }}>
        <CardContent>
          <Stack spacing={2.5} component="form" onSubmit={handleSubmit}>
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 700 }} gutterBottom>
                Create your account
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Choose the registration type that applies to you.
              </Typography>
            </Box>

            {error && <Alert severity="error">{error}</Alert>}
            {success && (
              <Alert
                severity="success"
                action={<Button component={RouterLink} to="/login" color="inherit" size="small">Sign in</Button>}
              >
                {success}
              </Alert>
            )}

            <FormControl>
              <RadioGroup
                row
                value={role}
                onChange={(event) => handleRoleChange(event.target.value as RegistrationRole)}
              >
                <FormControlLabel value="user" control={<Radio />} label="User registration" />
                <FormControlLabel value="admin" control={<Radio />} label="Admin registration" />
              </RadioGroup>
            </FormControl>

            {role === 'user' ? (
              <>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                  <TextField
                    label="First name"
                    value={firstName}
                    onChange={(event) => setFirstName(event.target.value)}
                    required
                    fullWidth
                    autoComplete="given-name"
                  />
                  <TextField
                    label="Last name"
                    value={lastName}
                    onChange={(event) => setLastName(event.target.value)}
                    required
                    fullWidth
                    autoComplete="family-name"
                  />
                </Stack>
                <TextField
                  label="Email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                  fullWidth
                  autoComplete="email"
                  helperText="Use your employee email and the first and last names on your existing employee record."
                />
                <TextField
                  label="Password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                  fullWidth
                  autoComplete="new-password"
                  inputProps={{ minLength: 8 }}
                />
                <TextField
                  label="Confirm password"
                  type="password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  required
                  fullWidth
                  autoComplete="new-password"
                  inputProps={{ minLength: 8 }}
                />
              </>
            ) : (
              <>
                <Alert severity="info">
                  Admin registration is available only while no Admin account exists. After the first Admin is registered,
                  additional Admins must be created by an existing Admin.
                </Alert>
                <TextField
                  label="Name"
                  value={adminName}
                  onChange={(event) => setAdminName(event.target.value)}
                  required
                  fullWidth
                  autoComplete="name"
                />
                <TextField
                  label="Email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                  fullWidth
                  autoComplete="email"
                />
                <TextField
                  label="Password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                  fullWidth
                  autoComplete="new-password"
                  inputProps={{ minLength: 8 }}
                />
              </>
            )}

            <Button type="submit" variant="contained" size="large" disabled={submitting}>
              {submitting ? 'Registering...' : `Register ${role === 'user' ? 'User' : 'Admin'}`}
            </Button>

            <Typography variant="body2" color="text.secondary" textAlign="center">
              Already have an account? <RouterLink to="/login">Sign in</RouterLink>
            </Typography>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  )
}
