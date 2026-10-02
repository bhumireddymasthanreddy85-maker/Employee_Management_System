import { Alert, Box, Button, Card, CardContent, Stack, TextField, Typography } from '@mui/material'
import { useState } from 'react'
import { Link as RouterLink, Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export function LoginPage() {
  const { login, isAuthenticated, isLoading, sessionExpired } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  if (isAuthenticated) {
    return <Navigate to="/" replace />
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError('')

    try {
      await login(email, password)
      navigate('/')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed. Please try again.')
    }
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #eef4ff 0%, #f6f8ff 100%)',
      }}
    >
      <Card sx={{ width: 420, maxWidth: 'calc(100vw - 32px)', p: 1, borderRadius: 3 }}>
        <CardContent>
          <Stack spacing={3} component="form" onSubmit={handleSubmit}>
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 700 }} gutterBottom>
                Sign in
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Employee Management System
              </Typography>
            </Box>

            {error && <Alert severity="error">{error}</Alert>}
            {sessionExpired && <Alert severity="warning">Your session expired. Please sign in again.</Alert>}

            <TextField
              label="Email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              fullWidth
            />
            <TextField
              label="Password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              inputProps={{ minLength: 6 }}
              fullWidth
            />

            <Button type="submit" variant="contained" size="large" disabled={isLoading}>
              {isLoading ? 'Signing in...' : 'Login'}
            </Button>

            <Typography variant="body2" color="text.secondary" textAlign="center">
              New to EmployeeHub? <RouterLink to="/register">Create an account</RouterLink>
            </Typography>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  )
}
