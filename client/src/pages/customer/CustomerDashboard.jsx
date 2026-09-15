import React from 'react';
import { useAuth } from '../../features/auth/authContext';

const CustomerDashboard = () => {
  const { currentUser } = useAuth();

  // Phase 1 Mock Overview Statistics (Structured for future API integration)
  const overviewStats = [
    {
      id: 'active-requests',
      title: 'Active Requests',
      value: 0,
      description: 'Pending and ongoing food assistance requests',
    },
    {
      id: 'completed-requests',
      title: 'Completed Requests',
      value: 0,
      description: 'Successfully delivered food requirements',
    },
    {
      id: 'meals-received',
      title: 'Meals Received',
      value: 0,
      description: 'Total estimated meals provided',
    },
  ];

  return (
    <div className="container" style={{ paddingTop: '2rem', paddingBottom: '2rem' }}>
      <header style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 700, color: '#111827', marginBottom: '0.5rem' }}>
          Customer Dashboard
        </h1>
        <p style={{ color: '#4b5563', fontSize: '1rem' }}>
          Welcome back, <strong>{currentUser?.name || 'Customer'}</strong>. Manage your food assistance requirements and track distributions.
        </p>
      </header>

      {/* Overview Cards Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '1.5rem',
          marginBottom: '2.5rem',
        }}
      >
        {overviewStats.map((stat) => (
          <div
            key={stat.id}
            style={{
              backgroundColor: '#ffffff',
              padding: '1.5rem',
              borderRadius: '8px',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
              border: '1px solid #e5e7eb',
            }}
          >
            <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', tracking: '0.05em' }}>
              {stat.title}
            </h3>
            <p style={{ fontSize: '2.25rem', fontWeight: 700, color: '#10b981', margin: '0.5rem 0' }}>
              {stat.value}
            </p>
            <p style={{ fontSize: '0.85rem', color: '#6b7280' }}>{stat.description}</p>
          </div>
        ))}
      </div>

      {/* Quick Action & Information Panel */}
      <section
        style={{
          backgroundColor: '#ffffff',
          padding: '2rem',
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
          border: '1px solid #e5e7eb',
        }}
      >
        <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#111827', marginBottom: '1rem' }}>
          Food Assistance Portal
        </h2>
        <p style={{ color: '#4b5563', marginBottom: '1.5rem', lineHeight: '1.6' }}>
          The Customer Portal allows verified recipient organizations and individuals to post food requirements, connect with local donors, and track food redistribution workflows.
        </p>
        <div style={{ backgroundColor: '#f9fafb', padding: '1.25rem', borderRadius: '6px', borderLeft: '4px solid #10b981' }}>
          <p style={{ fontSize: '0.9rem', color: '#374151', margin: 0 }}>
            <strong>Phase 1 Foundation Active:</strong> Full request creation, smart donor matching, and live delivery tracking will be enabled in subsequent workflow releases.
          </p>
        </div>
      </section>
    </div>
  );
};

export default CustomerDashboard;
