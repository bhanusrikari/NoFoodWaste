import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './features/auth/authContext';
import Navbar from './components/Navbar';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import DonorDashboard from './pages/DonorDashboard';
import VolunteerDashboard from './pages/VolunteerDashboard';
import AssignmentDetails from './pages/volunteer/AssignmentDetails';
import FoodSafetyVerification from './pages/volunteer/FoodSafetyVerification';
import DeliveryConfirmation from './pages/volunteer/DeliveryConfirmation';
import AdminDashboard from './pages/AdminDashboard';
import ProtectedRoute from './routes/ProtectedRoute';

const RootRedirect = () => {
  const { currentUser, isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <p>Loading application...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (currentUser.role === 'DONOR') return <Navigate to="/donor" replace />;
  if (currentUser.role === 'VOLUNTEER') return <Navigate to="/volunteer" replace />;
  if (currentUser.role === 'ADMIN') return <Navigate to="/admin" replace />;

  return <Navigate to="/login" replace />;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Navbar />
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected Routes */}
          <Route
            path="/donor"
            element={
              <ProtectedRoute allowedRoles={['DONOR']}>
                <DonorDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/volunteer"
            element={
              <ProtectedRoute allowedRoles={['VOLUNTEER']}>
                <VolunteerDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/volunteer/assignments/:id"
            element={
              <ProtectedRoute allowedRoles={['VOLUNTEER']}>
                <AssignmentDetails />
              </ProtectedRoute>
            }
          />
          <Route
            path="/volunteer/assignments/:id/verify"
            element={
              <ProtectedRoute allowedRoles={['VOLUNTEER']}>
                <FoodSafetyVerification />
              </ProtectedRoute>
            }
          />
          <Route
            path="/volunteer/assignments/:id/delivery"
            element={
              <ProtectedRoute allowedRoles={['VOLUNTEER']}>
                <DeliveryConfirmation />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />

          {/* Fallback & Root Route */}
          <Route path="/" element={<RootRedirect />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
