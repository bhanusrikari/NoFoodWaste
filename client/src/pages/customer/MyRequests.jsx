import React from 'react';
import { useAuth } from '../../features/auth/authContext';

const MyRequests = () => {
  const { currentUser } = useAuth();

  return (
    <div className="container" style={{ paddingTop: '2rem', paddingBottom: '2rem' }}>
      <header style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 700, color: '#111827', marginBottom: '0.5rem' }}>
          My Food Requests
        </h1>
        <p style={{ color: '#4b5563', fontSize: '1rem' }}>
          Track the status of your submitted food requirements and active fulfillment orders.
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
          Request History & Tracking (Upcoming Feature)
        </h2>
        <p style={{ color: '#4b5563', marginBottom: '1.5rem', lineHeight: '1.6' }}>
          This view will list all active, matched, in-transit, and completed food requests with real-time status updates and delivery receipts.
        </p>
        <div style={{ backgroundColor: '#f0fdf4', padding: '1.25rem', borderRadius: '6px', borderLeft: '4px solid #10b981' }}>
          <p style={{ fontSize: '0.9rem', color: '#166534', margin: 0 }}>
            <strong>Phase 2 Feature:</strong> Live status tracking, volunteer assignment details, and delivery acknowledgement will be connected here in the next release.
          </p>
        </div>
      </section>
    </div>
  );
};

export default MyRequests;
