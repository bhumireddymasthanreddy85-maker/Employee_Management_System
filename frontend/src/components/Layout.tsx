import Groups2Outlined from '@mui/icons-material/Groups2Outlined'
import LogoutRounded from '@mui/icons-material/LogoutRounded'
import { AppBar, Avatar, Box, Button, Container, Stack, Toolbar, Typography } from '@mui/material'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppBar position="sticky" elevation={0} sx={{ bgcolor: '#173f3a', color: '#fff' }}>
        <Container maxWidth="xl">
          <Toolbar disableGutters sx={{ minHeight: 68, display: 'flex', justifyContent: 'space-between', gap: 1.5, flexWrap: 'wrap' }}>
            <Stack direction="row" spacing={{ xs: 1, sm: 2.5 }} sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
              <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mr: { xs: 0.5, sm: 1 } }}>
                <Avatar variant="rounded" sx={{ width: 34, height: 34, bgcolor: '#d5e8df', color: '#174b46' }}>
                  <Groups2Outlined fontSize="small" />
                </Avatar>
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 750, lineHeight: 1.1 }}>EmployeeHub</Typography>
                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,.65)', display: { xs: 'none', sm: 'block' } }}>People operations</Typography>
                </Box>
              </Stack>
              <Stack direction="row" spacing={0.5}>
                {user?.role === 'admin' ? (
                  <>
                    <Button color="inherit" component={NavLink} to="/" end sx={{ color: 'rgba(255,255,255,.72)', '&.active': { color: '#fff', bgcolor: 'rgba(255,255,255,.12)' } }}>
                      Dashboard
                    </Button>
                    <Button color="inherit" component={NavLink} to="/employees" sx={{ color: 'rgba(255,255,255,.72)', '&.active': { color: '#fff', bgcolor: 'rgba(255,255,255,.12)' } }}>
                      Employees
                    </Button>
                    <Button color="inherit" component={NavLink} to="/admin/accounts" sx={{ color: 'rgba(255,255,255,.72)', '&.active': { color: '#fff', bgcolor: 'rgba(255,255,255,.12)' } }}>
                      Accounts
                    </Button>
                  </>
                ) : (
                  <Button color="inherit" component={NavLink} to="/my-profile" sx={{ color: 'rgba(255,255,255,.72)', '&.active': { color: '#fff', bgcolor: 'rgba(255,255,255,.12)' } }}>
                    My Profile
                  </Button>
                )}
                <Button color="inherit" component={NavLink} to="/change-password" sx={{ color: 'rgba(255,255,255,.72)', '&.active': { color: '#fff', bgcolor: 'rgba(255,255,255,.12)' } }}>
                  Change password
                </Button>
              </Stack>
            </Stack>

            <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
              <Typography variant="body2" sx={{ display: { xs: 'none', sm: 'block' }, color: 'rgba(255,255,255,.8)' }}>
                {user?.email} · {user?.role === 'admin' ? 'Admin' : 'User'}
              </Typography>
              <Button color="inherit" variant="outlined" size="small" startIcon={<LogoutRounded />} onClick={handleLogout} sx={{ borderColor: 'rgba(255,255,255,.35)' }}>
                Logout
              </Button>
            </Stack>
          </Toolbar>
        </Container>
      </AppBar>

      <Container component="main" maxWidth="xl" sx={{ py: { xs: 2.5, sm: 4 } }}>
        <Outlet />
      </Container>
    </Box>
  )
}
