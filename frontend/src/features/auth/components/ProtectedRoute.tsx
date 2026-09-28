import { Navigate, Outlet } from 'react-router-dom';

export function ProtectedRoute() {
    const token = localStorage.getItem('authToken');
    if (!token) {
        return <Navigate to="/auth/login" replace />;
    }
    return <Outlet />;
}