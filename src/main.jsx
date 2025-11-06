import { createRoot } from 'react-dom/client'
import { ThemeProvider, createTheme } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import './index.css'
import App from './App.jsx'

const theme = createTheme({
  palette: {
    primary: {
      main: '#3B82F6',
      lighter: '#DBEAFE',
    },
    secondary: {
      main: '#10B981',
      lighter: '#D1FAE5',
    },
    success: {
      main: '#10B981',
      lighter: '#D1FAE5',
    },
    warning: {
      main: '#F59E0B',
      lighter: '#FEF3C7',
    },
    error: {
      main: '#EF4444',
      lighter: '#FEE2E2',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h5: {
      fontWeight: 600,
    },
    h6: {
      fontWeight: 600,
    },
    body2: {
      fontWeight: 500,
    },
    caption: {
      fontSize: '0.75rem',
    },
  },
  components: {
    MuiTypography: {
      styleOverrides: {
        root: {
          fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
        },
      },
    },
    MuiSelect: {
      styleOverrides: {
        root: {
          fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
        },
      },
    },
  },
});

// StrictMode disabled to fix SSE connection issues
// StrictMode causes double-mounting which aborts SSE connections
createRoot(document.getElementById('root')).render(
  <ThemeProvider theme={theme}>
    <CssBaseline />
    <App />
  </ThemeProvider>
)
