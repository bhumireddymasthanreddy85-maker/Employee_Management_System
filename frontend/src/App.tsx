import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import { ProtectedRoute } from './components/ProtectedRoute'
import { AuthProvider, useAuth } from './context/AuthContext'
import { AccountRegistrationPage } from './pages/AccountRegistrationPage'
import { DashboardPage } from './pages/DashboardPage'
import { EmployeeDetailsPage } from './pages/EmployeeDetailsPage'
import { EmployeesPage } from './pages/EmployeesPage'
import { LoginPage } from './pages/LoginPage'
import { MyProfilePage } from './pages/MyProfilePage'
import { ChangePasswordPage } from './pages/ChangePasswordPage'
import { RegistrationPage } from './pages/RegistrationPage'

function AppRoutes() {
  const { isAuthenticated, user } = useAuth()
  const homePath = user?.must_change_password
    ? '/change-password'
    : user?.role === 'user'
      ? '/my-profile'
      : '/'

  return (
    <Routes>
      <Route path="/login" element={isAuthenticated ? <Navigate to={homePath} replace /> : <LoginPage />} />
      <Route path="/register" element={isAuthenticated ? <Navigate to={homePath} replace /> : <RegistrationPage />} />

      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<ProtectedRoute roles={['admin']}><DashboardPage /></ProtectedRoute>} />
        <Route path="/employees" element={<ProtectedRoute roles={['admin']}><EmployeesPage /></ProtectedRoute>} />
        <Route path="/employees/:id" element={<ProtectedRoute roles={['admin']}><EmployeeDetailsPage /></ProtectedRoute>} />
        <Route path="/admin/accounts" element={<ProtectedRoute roles={['admin']}><AccountRegistrationPage /></ProtectedRoute>} />
        <Route path="/my-profile" element={<ProtectedRoute roles={['user']}><MyProfilePage /></ProtectedRoute>} />
        <Route path="/change-password" element={<ProtectedRoute><ChangePasswordPage /></ProtectedRoute>} />
      </Route>

      <Route path="*" element={<Navigate to={isAuthenticated ? homePath : '/login'} replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  )
}
