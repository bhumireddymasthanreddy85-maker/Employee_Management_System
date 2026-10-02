import axios from 'axios'
import { Alert, Box, Button, Card, CardContent, Stack, TextField, Typography } from '@mui/material'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export function ChangePasswordPage() {
  const { changePassword, user } = useAuth()
  const navigate = useNavigate()
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const mustChange = Boolean(user?.must_change_password)

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError('')
    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters.')
      return
    }
    if (newPassword !== confirmPassword) {
      setError('New password and confirmation do not match.')
      return
    }

    setSubmitting(true)
    try {
      await changePassword(currentPassword, newPassword)
      navigate(user?.role === 'user' ? '/my-profile' : '/', { replace: true })
    } catch (err) {
      const responseDetail = axios.isAxiosError(err) ? err.response?.data?.detail : undefined
      setError(typeof responseDetail === 'string'
        ? responseDetail
        : err instanceof Error
          ? err.message
          : 'Unable to change password.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Box sx={{ maxWidth: 560, mx: 'auto' }}>
      <Card>
        <CardContent sx={{ p: { xs: 2.5, sm: 4 } }}>
          <Stack component="form" spacing={2.5} onSubmit={handleSubmit}>
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 700 }}>Change password</Typography>
              <Typography color="text.secondary" sx={{ mt: 1 }}>
                {mustChange
                  ? 'Your administrator provided a temporary password. Set a new password to continue.'
                  : 'Choose a new password for your account.'}
              </Typography>
            </Box>
            {error && <Alert severity="error">{error}</Alert>}
            <TextField
              label="Current password"
              type="password"
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
              required
              fullWidth
            />
            <TextField
              label="New password"
              type="password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              required
              fullWidth
              inputProps={{ minLength: 8 }}
              helperText="Use at least 8 characters."
            />
            <TextField
              label="Confirm new password"
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              required
              fullWidth
            />
            <Button type="submit" variant="contained" size="large" disabled={submitting}>
              {submitting ? 'Updating password...' : 'Update password'}
            </Button>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  )
}
