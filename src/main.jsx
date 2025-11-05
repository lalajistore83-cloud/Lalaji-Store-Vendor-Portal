import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// StrictMode disabled to fix SSE connection issues
// StrictMode causes double-mounting which aborts SSE connections
createRoot(document.getElementById('root')).render(
  <App />
)
