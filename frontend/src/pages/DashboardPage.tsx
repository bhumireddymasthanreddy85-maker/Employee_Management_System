import ArrowForwardRounded from '@mui/icons-material/ArrowForwardRounded'
import GroupsOutlined from '@mui/icons-material/GroupsOutlined'
import PersonAddAlt1Rounded from '@mui/icons-material/PersonAddAlt1Rounded'
import PersonOffOutlined from '@mui/icons-material/PersonOffOutlined'
import PersonOutlineRounded from '@mui/icons-material/PersonOutlineRounded'
import RefreshRounded from '@mui/icons-material/RefreshRounded'
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardActionArea,
  CardContent,
  Chip,
  CircularProgress,
  Grid,
  ListItemButton,
  Stack,
  Typography,
} from '@mui/material'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { employeeService } from '../api/services'
import type { DashboardStats, Employee } from '../types'

const statCards = [
  { label: 'Total employees', key: 'total_employees' as const, icon: GroupsOutlined, color: '#246b64', background: '#e3f1ed', filter: '' },
  { label: 'Active', key: 'active_employees' as const, icon: PersonOutlineRounded, color: '#2f7654', background: '#e8f2e8', filter: 'Active' },
  { label: 'Inactive', key: 'inactive_employees' as const, icon: PersonOffOutlined, color: '#ad5b37', background: '#f8ece5', filter: 'Inactive' },
]

export function DashboardPage() {
  const navigate = useNavigate()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [recentEmployees, setRecentEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadDashboard = async () => {
    try {
      setLoading(true)
      const [dashboardStats, employeePage] = await Promise.all([
        employeeService.getDashboardStats(),
        employeeService.getEmployees({ page: 1, limit: 5 }),
      ])
      setStats(dashboardStats)
      setRecentEmployees(employeePage.items)
      setError('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load dashboard data.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadDashboard()
  }, [])

  const total = stats?.total_employees ?? 0
  const activeShare = total ? ((stats?.active_employees ?? 0) / total) * 100 : 0
  const inactiveShare = total ? ((stats?.inactive_employees ?? 0) / total) * 100 : 0

  return (
    <Stack spacing={3}>
      <Stack className="dashboard-enter" direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ alignItems: { xs: 'stretch', sm: 'center' }, justifyContent: 'space-between' }}>
        <Box>
          <Typography variant="overline" sx={{ color: 'primary.main', fontWeight: 700 }}>PEOPLE OPERATIONS</Typography>
          <Typography variant="h4" sx={{ fontWeight: 750 }}>Workforce overview</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>A live snapshot of your employee directory.</Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <Button variant="outlined" startIcon={<RefreshRounded />} onClick={() => void loadDashboard()} disabled={loading}>Refresh</Button>
          <Button variant="contained" startIcon={<PersonAddAlt1Rounded />} onClick={() => navigate('/employees?action=create')}>Add employee</Button>
        </Stack>
      </Stack>

      {error && <Alert severity="error" action={<Button color="inherit" size="small" onClick={() => void loadDashboard()}>Retry</Button>}>{error}</Alert>}

      <Grid className="dashboard-enter" container spacing={2}>
        {statCards.map((card) => {
          const Icon = card.icon
          return (
            <Grid key={card.key} size={{ xs: 12, sm: 4 }}>
              <Card sx={{ height: '100%', border: '1px solid', borderColor: 'divider' }}>
                <CardActionArea
                  aria-label={`View ${card.label.toLowerCase()}`}
                  onClick={() => navigate(card.filter ? `/employees?status=${card.filter}` : '/employees')}
                  sx={{ height: '100%' }}
                >
                  <CardContent sx={{ p: 2.5 }}>
                    <Stack direction="row" spacing={2} sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
                      <Box>
                        <Typography variant="body2" color="text.secondary">{card.label}</Typography>
                        {loading && !stats ? <CircularProgress size={24} sx={{ mt: 1 }} /> : (
                          <Typography variant="h3" sx={{ mt: 0.5, color: card.color, fontWeight: 750 }}>{stats?.[card.key] ?? 0}</Typography>
                        )}
                      </Box>
                      <Avatar sx={{ bgcolor: card.background, color: card.color, width: 48, height: 48 }}><Icon /></Avatar>
                    </Stack>
                    <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center', color: 'text.secondary', mt: 1.5 }}>
                      <Typography variant="caption">Open employee list</Typography>
                      <ArrowForwardRounded sx={{ fontSize: 16 }} />
                    </Stack>
                  </CardContent>
                </CardActionArea>
              </Card>
            </Grid>
          )
        })}
      </Grid>

      <Grid className="dashboard-enter" container spacing={2}>
        <Grid size={{ xs: 12, md: 8 }}>
          <Card sx={{ height: '100%', border: '1px solid', borderColor: 'divider' }}>
            <CardContent sx={{ p: 0 }}>
              <Stack direction="row" sx={{ px: 2.5, py: 2, justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>Recently added</Typography>
                  <Typography variant="body2" color="text.secondary">Latest employee profiles</Typography>
                </Box>
                <Button endIcon={<ArrowForwardRounded />} onClick={() => navigate('/employees')}>Directory</Button>
              </Stack>
              {loading && !recentEmployees.length ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress size={24} /></Box>
              ) : recentEmployees.length ? (
                <Stack>
                  {recentEmployees.map((employee) => (
                    <ListItemButton key={employee.id} divider onClick={() => navigate(`/employees/${employee.id}`)} sx={{ px: 2.5, py: 1.5, gap: 1.5 }}>
                      <Avatar sx={{ bgcolor: '#e7edf4', color: '#32475b', width: 40, height: 40 }}>
                        {`${employee.first_name[0] ?? ''}${employee.last_name[0] ?? ''}`.toUpperCase()}
                      </Avatar>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="body2" sx={{ fontWeight: 650 }} noWrap>{employee.first_name} {employee.last_name}</Typography>
                        <Typography variant="caption" color="text.secondary" noWrap>{employee.designation} · {employee.department}</Typography>
                      </Box>
                      <Chip size="small" label={employee.status} color={employee.status === 'Active' ? 'success' : 'default'} variant="outlined" />
                    </ListItemButton>
                  ))}
                </Stack>
              ) : (
                <Typography color="text.secondary" sx={{ px: 2.5, py: 4 }}>No employees yet.</Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <Card sx={{ height: '100%', border: '1px solid', borderColor: 'divider' }}>
            <CardContent sx={{ p: 2.5 }}>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>Team status</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>{total} {total === 1 ? 'employee' : 'employees'} in the directory</Typography>
              <Box role="img" aria-label={`${stats?.active_employees ?? 0} active and ${stats?.inactive_employees ?? 0} inactive employees`} sx={{ display: 'flex', gap: 0.5, height: 12, mt: 3, mb: 2, overflow: 'hidden', borderRadius: 1 }}>
                <Box sx={{ width: `${activeShare}%`, bgcolor: '#3d805d', transition: 'width 400ms ease' }} />
                <Box sx={{ width: `${inactiveShare}%`, bgcolor: '#d18a54', transition: 'width 400ms ease' }} />
              </Box>
              <Stack spacing={1.5}>
                <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
                  <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}><Box sx={{ width: 9, height: 9, borderRadius: '50%', bgcolor: '#3d805d' }} /><Typography variant="body2">Active</Typography></Stack>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>{stats?.active_employees ?? 0}</Typography>
                </Stack>
                <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
                  <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}><Box sx={{ width: 9, height: 9, borderRadius: '50%', bgcolor: '#d18a54' }} /><Typography variant="body2">Inactive</Typography></Stack>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>{stats?.inactive_employees ?? 0}</Typography>
                </Stack>
              </Stack>
              <Button fullWidth variant="outlined" sx={{ mt: 3 }} onClick={() => navigate('/employees')}>Manage team</Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Stack>
  )
}
