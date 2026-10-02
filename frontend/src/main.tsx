import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { CssBaseline, ThemeProvider, createTheme } from '@mui/material'
import './index.css'
import App from './App'

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#246b64', dark: '#174b46', light: '#e3f1ed' },
    secondary: { main: '#bd6543' },
    background: { default: '#f3f6f4', paper: '#ffffff' },
  },
  shape: { borderRadius: 8 },
  typography: {
    fontFamily: '"Aptos", "Segoe UI Variable", "Segoe UI", sans-serif',
    h4: { fontWeight: 700 },
    button: { fontWeight: 650, textTransform: 'none' },
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          backgroundImage: 'none',
          boxShadow: '0 2px 10px rgba(24, 49, 43, 0.045)',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: { borderRadius: 6 },
      },
    },
  },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <App />
    </ThemeProvider>
  </StrictMode>,
)
