import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './features/auth/authContext';
import Navbar from './components/Navbar';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import DonorDashboard from './pages/DonorDashboard';
import VolunteerDashboard from './pages/VolunteerDashboard';
import AdminDashboard from './pages/AdminDashboard';
import ProtectedRoute from './routes/ProtectedRoute';

// Customer Feature Imports
import CustomerLayout from './features/customer/components/CustomerLayout';
import CustomerDashboard from './pages/customer/CustomerDashboard';
import RequestFood from './pages/customer/RequestFood';
import MyRequests from './pages/customer/MyRequests';
import RequestDetails from './pages/customer/RequestDetails';
import AvailableDonations from './pages/customer/AvailableDonations';
import DonationDetails from './pages/customer/DonationDetails';
import MyDonationInterests from './pages/customer/MyDonationInterests';

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
  if (currentUser.role === 'CUSTOMER') return <Navigate to="/customer" replace />;
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
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />

          {/* Protected Customer Routes */}
          <Route
            path="/customer"
            element={
              <ProtectedRoute allowedRoles={['CUSTOMER']}>
                <CustomerLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<CustomerDashboard />} />
            <Route path="request-food" element={<RequestFood />} />
            <Route path="requests" element={<MyRequests />} />
            <Route path="requests/:id" element={<RequestDetails />} />
            <Route path="donations" element={<AvailableDonations />} />
            <Route path="donations/interests" element={<MyDonationInterests />} />
            <Route path="donations/:id" element={<DonationDetails />} />
          </Route>

          {/* Fallback & Root Route */}
          <Route path="/" element={<RootRedirect />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
