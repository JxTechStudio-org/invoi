import { BrowserRouter, Routes, Route } from "react-router-dom"
import { ConfigProvider } from 'antd';
import { lightTheme } from './config/theme/theme'
import LandingPage from './features/landing/pages/landingPage'
import {AppThemeProvider} from './features/shared/context/themContext'
import NavBar from './features/shared/components/NavBar'
import NotFoundPage from './features/shared/pages/NotFoundPage'
import './App.css'

function App() {
  return (
    <>
      <AppThemeProvider >
        <BrowserRouter>
          <Routes>
            <Route path='/' element={<LandingPage />} />
            <Route element ={ <NavBar/>}>
              <Route path='/dashboard' element={<div>Dashboard</div>} />
              <Route path='/invoices' element={<div>Invoices</div>} />
              <Route path='/vendors' element={<div>Vendors</div>} />
              <Route path='/analytics' element={<div>Analytics</div>} />
              <Route path='/settings' element={<div>Settings</div>} />
              <Route path='*' element={<NotFoundPage />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AppThemeProvider>
    </>
  )
}

export default App

