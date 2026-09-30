import { Navigate, Outlet, useLocation } from 'react-router-dom';

export function ProtectedRoute() {
    const token = localStorage.getItem('authToken');
    const location = useLocation();

    if (!token) {
        return <Navigate to="/auth/login" state={{ from: location }} replace />;
    }
    return <Outlet />;
}