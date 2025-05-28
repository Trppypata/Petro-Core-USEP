import router from '@/routes/router'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import { Toaster } from "sonner"
import './index.css'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

// Create a client
const queryClient = new QueryClient()

createRoot(document.getElementById('root')!).render(
  <StrictMode> 
    <QueryClientProvider client={queryClient}>
      <Toaster richColors /> 
      <div className="E5E5E5">
        <RouterProvider router={router} />
      </div>
    </QueryClientProvider>
  </StrictMode>,
)
