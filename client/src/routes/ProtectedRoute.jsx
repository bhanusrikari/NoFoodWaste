import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../features/auth/authContext';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { currentUser, isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <p>Loading session...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(currentUser.role)) {
    // Redirect user to their own role dashboard if unauthorized for this route
    const roleRoutes = {
      DONOR: '/donor',
      VOLUNTEER: '/volunteer',
      ADMIN: '/admin',
    };
    const targetRoute = roleRoutes[currentUser.role] || '/login';
    return <Navigate to={targetRoute} replace />;
  }

  return children;
};

export default ProtectedRoute;
