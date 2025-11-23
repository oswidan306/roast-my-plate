import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { RoastSessionProvider } from './context/RoastSessionContext'
import App from './App.tsx'
import './styles/global.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <RoastSessionProvider>
        <App />
      </RoastSessionProvider>
    </BrowserRouter>
  </StrictMode>
)
