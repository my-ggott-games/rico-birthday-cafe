import React from 'react';
import { /* Navigate, */ Outlet } from 'react-router-dom';
// import { useAuthStore } from '../../store/useAuthStore';

interface ProtectedRouteProps {
    redirectPath?: string;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ /* redirectPath = '/' */ }) => {
    // const { isAuthenticated } = useAuthStore();

    // if (!isAuthenticated) {
    //     return <Navigate to={redirectPath} replace />;
    // }

    return <Outlet />;
};
