import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import App from './App.tsx'
import './index.css'
import { UserProvider } from './store/UserContext.tsx'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, 
      retry: 1,
    },
  },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <UserProvider>
      <BrowserRouter>
        <App />
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#151D35',
              color: '#E8EDF5',
              border: '1px solid #1E2A45',
              fontFamily: 'Syne, sans-serif',
              fontSize: '14px',
            },
            success: { iconTheme: { primary: '#B8FF00', secondary: '#0A0E1A' } },
            error:   { iconTheme: { primary: '#FF4D6D', secondary: '#0A0E1A' } },
          }}
        />
      </BrowserRouter>
      </UserProvider>
    </QueryClientProvider>
  </StrictMode>,
)
