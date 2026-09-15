import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../features/auth/authContext';
import { donationService } from '../services/donationService';
import { fulfillmentService } from '../services/fulfillmentService';

const DonorDashboard = () => {
  const { currentUser } = useAuth();
  const [stats, setStats] = useState({
    activeDonations: 0,
    pendingDonations: 0,
    completedDonations: 0,
    totalMealsDonated: 0,
  });
  const [recentFulfillments, setRecentFulfillments] = useState([]);
  const [myDonations, setMyDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [statsData, fulfillmentsData, myDonationsData] = await Promise.all([
        donationService.getStats(),
        fulfillmentService.getMy(),
        donationService.getMy(),
      ]);

      if (statsData.success) {
        setStats(statsData.stats);
      }
      if (fulfillmentsData.success) {
        setRecentFulfillments(fulfillmentsData.fulfillments.slice(0, 5));
      }
      if (myDonationsData.success) {
        setMyDonations(myDonationsData.donations || []);
      }
    } catch (err) {
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      {/* Header */}
      <div className="dashboard-header">
        <h1>Welcome back, {currentUser?.name || 'Donor'} 👋</h1>
        <p>Connecting surplus food supply with community food demand.</p>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {/* Stats Section */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">🍲</div>
          <div>
            <div className="stat-value">{stats.activeDonations}</div>
            <div className="stat-label">Active Fulfillments</div>
          </div>
        </div>

        <div className="stat-card" style={{ borderLeftColor: '#f59e0b' }}>
          <div className="stat-icon" style={{ background: '#fef3c7' }}>⏳</div>
          <div>
            <div className="stat-value">{stats.pendingDonations}</div>
            <div className="stat-label">Pending Deliveries</div>
          </div>
        </div>

        <div className="stat-card" style={{ borderLeftColor: '#10b981' }}>
          <div className="stat-icon" style={{ background: '#d1fae5' }}>✅</div>
          <div>
            <div className="stat-value">{stats.completedDonations}</div>
            <div className="stat-label">Completed Donations</div>
          </div>
        </div>

        <div className="stat-card" style={{ borderLeftColor: '#3b82f6' }}>
          <div className="stat-icon" style={{ background: '#dbeafe' }}>📊</div>
          <div>
            <div className="stat-value">{stats.totalMealsDonated}</div>
            <div className="stat-label">Total Meals Shared</div>
          </div>
        </div>
      </div>

      {/* Two Core Entry Points Banner */}
      <div className="actions-banner">
        <h2>What would you like to do today?</h2>
        <p>Select how you want to contribute to local food redistribution.</p>
        <div className="cta-grid">
          <div className="cta-card">
            <div>
              <h3>📋 Fulfill an Existing Request</h3>
              <p>Browse open food requirements posted by verified beneficiaries, orphanages, and shelters in your area.</p>
            </div>
            <Link to="/donor/requirements" className="btn">
              Browse & Fulfill Requests →
            </Link>
          </div>

          <div className="cta-card">
            <div>
              <h3>🎁 Donate Food to Someone in Need</h3>
              <p>Have surplus food ready right now? Enter details to auto-match or discover verified local beneficiaries.</p>
            </div>
            <Link to="/donor/donate" className="btn">
              Donate Food Now →
            </Link>
          </div>
        </div>
      </div>

      {/* My Food Donations & Customer Interests Section */}
      {myDonations.length > 0 && (
        <div className="card-table" style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3>My Posted Food Offerings ({myDonations.length})</h3>
            <span style={{ fontSize: '0.85rem', color: '#6b7280' }}>Customer Phase 6 Demand Overview</span>
          </div>

          <table>
            <thead>
              <tr>
                <th>Donation ID</th>
                <th>Food & Quantity</th>
                <th>Pickup Location</th>
                <th>Status</th>
                <th>Interested Customers</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {myDonations.map((d) => (
                <tr key={d.id}>
                  <td><strong>#D-{d.id.slice(-6).toUpperCase()}</strong></td>
                  <td>
                    <strong>{d.quantity} {d.unit || 'Meals'}</strong> — {d.foodType}
                    <div style={{ fontSize: '0.78rem', color: '#6b7280' }}>Cuisine: {d.cuisine}</div>
                  </td>
                  <td>📍 {d.pickupAddress || d.location}</td>
                  <td>
                    <span className={`status-badge status-${d.status}`}>
                      {d.status}
                    </span>
                  </td>
                  <td>
                    <span
                      style={{
                        backgroundColor: d.interestedCount > 0 ? '#dbeafe' : '#f3f4f6',
                        color: d.interestedCount > 0 ? '#1e40af' : '#6b7280',
                        fontWeight: 700,
                        padding: '0.25rem 0.65rem',
                        borderRadius: '12px',
                        fontSize: '0.85rem',
                      }}
                    >
                      👥 {d.interestedCount || 0} Interested
                    </span>
                  </td>
                  <td>
                    <Link
                      to={`/donor/donations/${d.id}/interests`}
                      className="btn btn-outline"
                      style={{ padding: '0.3rem 0.65rem', fontSize: '0.8rem' }}
                    >
                      View Interested Customers ({d.interestedCount || 0}) →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Recent Fulfillments Table */}
      <div className="card-table">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3>Recent Redistribution Activity</h3>
          <Link to="/donor/fulfillments" style={{ fontWeight: 600, fontSize: '0.9rem' }}>
            View All ({recentFulfillments.length}) →
          </Link>
        </div>

        {loading ? (
          <p style={{ textAlign: 'center', padding: '1.5rem', color: '#6b7280' }}>Loading activity...</p>
        ) : recentFulfillments.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
            <p>No active donations or fulfillments yet.</p>
            <div style={{ marginTop: '1rem' }}>
              <Link to="/donor/donate" className="btn btn-primary">Create Your First Donation</Link>
            </div>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Food & Quantity</th>
                <th>Recipient / Beneficiary</th>
                <th>Delivery Method</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {recentFulfillments.map((item) => (
                <tr key={item.id}>
                  <td><strong>{item.fulfillmentId}</strong></td>
                  <td>
                    {item.foodSummary?.foodType || 'Meals'} - {item.foodSummary?.quantity} {item.foodSummary?.unit || 'Meals'}
                    <div style={{ fontSize: '0.78rem', color: '#6b7280' }}>{item.foodSummary?.foodItems}</div>
                  </td>
                  <td>
                    <strong>{item.recipientName}</strong>
                    <div style={{ fontSize: '0.78rem', color: '#6b7280' }}>📍 {item.recipientLocation}</div>
                  </td>
                  <td>
                    <span className={`delivery-badge delivery-${item.deliveryMethod}`}>
                      {item.deliveryMethod === 'DIRECT' ? '🚲 Direct Delivery' : '🚗 Volunteer Assistance'}
                    </span>
                  </td>
                  <td>
                    <span className={`status-badge status-${item.status}`}>
                      {item.status.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td>
                    <Link to={`/donor/fulfillments/${item.id}`} className="btn btn-outline" style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem' }}>
                      View Details
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Your Impact Section */}
      <div className="card-table" style={{ background: '#ecfdf5', border: '1.5px solid #a7f3d0' }}>
        <h3 style={{ color: '#065f46' }}>Your Impact ❤️</h3>
        <p style={{ color: '#047857', fontSize: '0.95rem', marginTop: '0.4rem' }}>
          Through your donations, you have directly provided <strong>{stats.totalMealsDonated} meals</strong> to children, shelters, and families in need. Together we eliminate hunger and food waste!
        </p>
      </div>
    </div>
  );
};

export default DonorDashboard;
