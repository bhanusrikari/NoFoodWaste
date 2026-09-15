import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../features/auth/authContext';
import { getMyFoodRequests } from '../../features/customer/services/foodRequestService';

const CustomerDashboard = () => {
  const { currentUser } = useAuth();
  const [stats, setStats] = useState({
    activeCount: 0,
    completedCount: 0,
    mealsReceived: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const calculateMetrics = async () => {
      try {
        const res = await getMyFoodRequests();
        if (res.success && Array.isArray(res.data)) {
          const userRequests = res.data;

          const active = userRequests.filter((req) =>
            ['OPEN', 'MATCHED', 'DELIVERY_ASSIGNED', 'OUT_FOR_DELIVERY'].includes(req.status)
          ).length;

          const completedRequests = userRequests.filter((req) =>
            ['DELIVERED', 'ACKNOWLEDGED'].includes(req.status)
          );

          const completed = completedRequests.length;

          const meals = completedRequests.reduce(
            (sum, req) => sum + (Number(req.peopleCount) || 0),
            0
          );

          setStats({
            activeCount: active,
            completedCount: completed,
            mealsReceived: meals,
          });
        }
      } catch (err) {
        console.error('[CustomerDashboard] Error fetching metrics:', err.message);
      } finally {
        setLoading(false);
      }
    };

    calculateMetrics();
  }, []);

  const overviewStats = [
    {
      id: 'active-requests',
      title: 'Active Requests',
      value: loading ? '...' : stats.activeCount,
      description: 'Currently open and ongoing food assistance requests',
    },
    {
      id: 'completed-requests',
      title: 'Completed Requests',
      value: loading ? '...' : stats.completedCount,
      description: 'Successfully delivered and acknowledged food requirements',
    },
    {
      id: 'meals-received',
      title: 'Meals Received',
      value: loading ? '...' : stats.mealsReceived,
      description: 'Total estimated meals provided from completed deliveries',
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
          <div style={{ display: 'flex', gap: '1rem' }}>
            <Link
              to="/customer/requests"
              className="btn"
              style={{ width: 'auto', padding: '0.6rem 1.25rem', fontSize: '0.9rem', backgroundColor: '#f3f4f6', color: '#374151' }}
            >
              View My Requests
            </Link>
            <Link
              to="/customer/request-food"
              className="btn btn-primary"
              style={{ width: 'auto', padding: '0.6rem 1.25rem', fontSize: '0.9rem' }}
            >
              Create Food Requirement
            </Link>
          </div>
        </div>

        <p style={{ color: '#4b5563', marginBottom: '1.5rem', lineHeight: '1.6' }}>
          Post food requirements for your organization or community group. Your submitted requests will be made available for matching and distribution in upcoming workflow releases.
        </p>

        <div style={{ backgroundColor: '#f9fafb', padding: '1.25rem', borderRadius: '6px', borderLeft: '4px solid #10b981' }}>
          <p style={{ fontSize: '0.9rem', color: '#374151', margin: 0 }}>
            <strong>Phase 3 Active:</strong> Full request management, stage progress timeline, client-side status filtering, and live metric calculations are enabled.
          </p>
        </div>
      </section>
    </div>
  );
};

export default CustomerDashboard;
