import React from 'react';
import { useAuth } from '../../features/auth/authContext';

const RequestFood = () => {
  const { currentUser } = useAuth();

  return (
    <div className="container" style={{ paddingTop: '2rem', paddingBottom: '2rem' }}>
      <header style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 700, color: '#111827', marginBottom: '0.5rem' }}>
          Request Food Assistance
        </h1>
        <p style={{ color: '#4b5563', fontSize: '1rem' }}>
          Submit a new food requirement for your organization or community group.
        </p>
      </header>

      <section
        style={{
          backgroundColor: '#ffffff',
          padding: '2.5rem',
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
          border: '1px solid #e5e7eb',
        }}
      >
        <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#111827', marginBottom: '1rem' }}>
          Food Request Form (Upcoming Feature)
        </h2>
        <p style={{ color: '#4b5563', marginBottom: '1.5rem', lineHeight: '1.6' }}>
          This interface will allow customers to specify meal quantities, dietary preferences, urgency levels, and delivery locations.
        </p>
        <div style={{ backgroundColor: '#eff6ff', padding: '1.25rem', borderRadius: '6px', borderLeft: '4px solid #3b82f6' }}>
          <p style={{ fontSize: '0.9rem', color: '#1e40af', margin: 0 }}>
            <strong>Phase 2 Feature:</strong> Interactive request submissions and automated donor matching workflows will be activated in the next development iteration.
          </p>
        </div>
      </section>
    </div>
  );
};

export default RequestFood;
