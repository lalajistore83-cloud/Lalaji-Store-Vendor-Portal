import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Only use StrictMode in development
const isDevelopment = import.meta.env.MODE === 'development';

createRoot(document.getElementById('root')).render(
  isDevelopment ? (
    <StrictMode>
      <App />
    </StrictMode>
  ) : (
    <App />
  )
)
