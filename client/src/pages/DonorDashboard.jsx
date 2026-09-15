import React from 'react';
import { useAuth } from '../features/auth/authContext';

const DonorDashboard = () => {
  const { currentUser } = useAuth();

  return (
    <div className="container">
      <div className="dashboard-card">
        <h1>🥦 Donor Dashboard</h1>
        <p>Welcome to the Donor Portal. (Phase 1 Placeholder Route)</p>

        <div className="dashboard-info">
          <p><strong>Authenticated User Details:</strong></p>
          <pre>{JSON.stringify(currentUser, null, 2)}</pre>
        </div>
      </div>
    </div>
  );
};

export default DonorDashboard;
