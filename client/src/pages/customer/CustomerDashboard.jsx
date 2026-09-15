import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../features/auth/authContext';
import { getMyFoodRequests } from '../../features/customer/services/foodRequestService';

const CustomerDashboard = () => {
  const { currentUser } = useAuth();
  const [activeCount, setActiveCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchActiveCount = async () => {
      try {
        const res = await getMyFoodRequests();
        if (res.success && res.data) {
          const openRequests = res.data.filter((req) => req.status === 'OPEN');
          setActiveCount(openRequests.length);
        }
      } catch (err) {
        console.error('[CustomerDashboard] Error fetching active requests:', err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchActiveCount();
  }, []);

  const overviewStats = [
    {
      id: 'active-requests',
      title: 'Active Requests',
      value: loading ? '...' : activeCount,
      description: 'Currently open food assistance requests',
    },
    {
      id: 'completed-requests',
      title: 'Completed Requests',
      value: 0,
      description: 'Successfully delivered food requirements (Phase 3+)',
    },
    {
      id: 'meals-received',
      title: 'Meals Received',
      value: 0,
      description: 'Total estimated meals provided (Phase 3+)',
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
            <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#111827', margin: 0 }}>
            Food Assistance Actions
          </h2>
          <Link
            to="/customer/request-food"
            className="btn btn-primary"
            style={{ width: 'auto', padding: '0.6rem 1.25rem', fontSize: '0.9rem' }}
          >
            Create Food Requirement
          </Link>
        </div>

        <p style={{ color: '#4b5563', marginBottom: '1.5rem', lineHeight: '1.6' }}>
          Post food requirements for your organization or community group. Your submitted requests will be made available for matching and distribution in upcoming workflow releases.
        </p>

        <div style={{ backgroundColor: '#f9fafb', padding: '1.25rem', borderRadius: '6px', borderLeft: '4px solid #10b981' }}>
          <p style={{ fontSize: '0.9rem', color: '#374151', margin: 0 }}>
            <strong>Phase 2 Active:</strong> Food requirement creation and request tracking are fully active. Matching, volunteer delivery, and receipt acknowledgement will be enabled in subsequent workflow releases.
          </p>
        </div>
      </section>
    </div>
  );
};

export default CustomerDashboard;
