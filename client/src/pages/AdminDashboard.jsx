import React from 'react';
import { useAuth } from '../features/auth/authContext';

const AdminDashboard = () => {
  const { currentUser } = useAuth();

  return (
    <div className="container">
      <div className="dashboard-card">
        <h1>⚙️ Admin Dashboard</h1>
        <p>Welcome to the Administrative Portal. (Phase 1 Placeholder Route)</p>

        <div className="dashboard-info">
          <p><strong>Authenticated User Details:</strong></p>
          <pre>{JSON.stringify(currentUser, null, 2)}</pre>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
