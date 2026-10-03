import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route } from "react-router-dom"
import { AppThemeProvider } from './features/shared/context/themContext'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from './services/api/queryClient'
import { ProtectedRoute } from './features/auth/components/ProtectedRoute'
import NavBar from './features/shared/components/NavBar'
import PageLoader from './features/shared/components/PageLoader'
import './App.css'

const LandingPage = lazy(() => import('./features/landing/pages/landingPage'))
const NotFoundPage = lazy(() => import('./features/shared/pages/NotFoundPage'))
const UploadInvoicePage = lazy(() => import('./features/invoice/pages/uploadInvoicePage'))
const InvoiceDetailPage = lazy(() => import('./features/invoice/pages/InvoiceDetailPage'))
const AuthPage = lazy(() => import('./features/auth/pages/AuthPage'))
const ForgotPasswordPage = lazy(() => import('./features/auth/pages/ForgotPasswordPage'))
const InvoiceListPage = lazy(() => import('./features/invoice/pages/InvoicesListPage'))
const DashboardPage = lazy(() => import('./features/dashboard/pages/DashboardPage'))


function App() {
  return (
    <>
      <QueryClientProvider client={queryClient}>
        <AppThemeProvider >
          <BrowserRouter>
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route path='/' element={<LandingPage />} />
                <Route path='/auth' >
                  <Route path='login' element={<AuthPage />} />
                  <Route path='register' element={<AuthPage />} />
                  <Route path='forgot-password' element={<ForgotPasswordPage />} />
                </Route>
                <Route element={<ProtectedRoute />}>
                  <Route element={<NavBar />}>
                    <Route path='/dashboard' element={<DashboardPage />} />
                    <Route path='/vendors' element={<div>Vendors</div>} />
                    <Route path='/analytics' element={<div>Analytics</div>} />
                    <Route path='/settings' element={<div>Settings</div>} />
                    <Route path='/invoices' element={<InvoiceListPage />} />
                    <Route path='/upload-invoice' element={<UploadInvoicePage />} />
                    <Route path='/invoices/:id' element={<InvoiceDetailPage />} />

                  </Route>
                </Route>

                <Route path='*' element={<NotFoundPage />} />

              </Routes>
            </Suspense>
          </BrowserRouter>
        </AppThemeProvider>
      </QueryClientProvider>
    </>
  )
}

export default App

