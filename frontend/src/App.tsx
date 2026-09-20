import { BrowserRouter, Routes, Route } from "react-router-dom"
import { AppThemeProvider } from './features/shared/context/themContext'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import LandingPage from './features/landing/pages/landingPage'
import NavBar from './features/shared/components/NavBar'
import NotFoundPage from './features/shared/pages/NotFoundPage'
import UploadInvoicePage from './features/invoice/pages/uploadInvoicPage'
import InvoiceDetailPage from "./features/invoice/pages/InvoiceDetailPage"
import AuthPage from './features/auth/pages/AuthPage'
import ForgotPasswordPage from './features/auth/pages/ForgotPasswordPage'
import InvoiceListPage from "./features/invoice/pages/InvoicesListPage"

import './App.css'

const queryClient = new QueryClient()

function App() {
  return (
    <>
      <QueryClientProvider client={queryClient}>
        <AppThemeProvider >
          <BrowserRouter>
            <Routes>
              <Route path='/' element={<LandingPage />} />
              <Route path='/auth' >
                <Route path='login' element={<AuthPage />} />
                <Route path='register' element={<AuthPage />} />
                <Route path='forgot-password' element={<ForgotPasswordPage />} />
              </Route>
              <Route element={<NavBar />}>
                <Route path='/dashboard' element={<div>Dashboard</div>} />
                <Route path='/vendors' element={<div>Vendors</div>} />
                <Route path='/analytics' element={<div>Analytics</div>} />
                <Route path='/settings' element={<div>Settings</div>} />
                <Route path='/invoices' element={<InvoiceListPage />} />
                <Route path='/upload-invoice' element={<UploadInvoicePage />} />
                <Route path='/invoices/:id' element={<InvoiceDetailPage />} />

                <Route path='*' element={<NotFoundPage />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </AppThemeProvider>
      </QueryClientProvider>
    </>
  )
}

export default App

