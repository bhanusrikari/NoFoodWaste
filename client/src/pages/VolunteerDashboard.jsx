import React from 'react';
import { useAuth } from '../features/auth/authContext';

const VolunteerDashboard = () => {
  const { currentUser } = useAuth();

  return (
    <div className="container">
      <div className="dashboard-card">
        <h1>🚚 Volunteer Dashboard</h1>
        <p>Welcome to the Volunteer Portal. (Phase 1 Placeholder Route)</p>

        <div className="dashboard-info">
          <p><strong>Authenticated User Details:</strong></p>
          <pre>{JSON.stringify(currentUser, null, 2)}</pre>
        </div>
      </div>
    </div>
  );
};

export default VolunteerDashboard;
