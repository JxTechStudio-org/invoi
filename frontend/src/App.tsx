import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ConfigProvider } from 'antd';
import { lightTheme } from './config/theme/theme';
import LandingPage from './features/landing/pages/landingPage';
import './App.css';


function App() {
  return (
    <>
      <ConfigProvider theme={lightTheme}>
        <BrowserRouter>
          <Routes>
            <Route path='/' element={<LandingPage />} />
          </Routes>
        </BrowserRouter>
      </ConfigProvider>
    </>
  );
}

export default App;

