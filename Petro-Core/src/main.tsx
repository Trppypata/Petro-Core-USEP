import router from '@/routes/router'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import { Toaster } from "sonner"
import './index.css'



createRoot(document.getElementById('root')!).render(
  <StrictMode> 
    <Toaster richColors /> 

       <div className="E5E5E5">
        <RouterProvider router={router} />
      </div>

      </StrictMode>,
)
