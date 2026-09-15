import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getMyInterests, withdrawInterest } from '../../features/customer/services/donationService';

const statusBadgeConfig = {
  INTERESTED: {
    label: 'Interested',
    bg: '#f0fdfa',
    color: '#0f766e',
    border: '#99f6e4',
  },
  SELECTED: {
    label: 'Selected',
    bg: '#f0fdf4',
    color: '#15803d',
    border: '#bbf7d0',
  },
  REJECTED: {
    label: 'Not Selected',
    bg: '#fef2f2',
    color: '#b91c1c',
    border: '#fecaca',
  },
  WITHDRAWN: {
    label: 'Withdrawn',
    bg: '#f3f4f6',
    color: '#4b5563',
    border: '#e5e7eb',
  },
};

const MyDonationInterests = () => {
  const [interests, setInterests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionId, setActionId] = useState(null);

  const fetchInterests = async () => {
    try {
      const res = await getMyInterests();
      if (res.success) {
        setInterests(res.data || []);
      }
    } catch (err) {
      setError(err.message || 'Failed to load your donation interests.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInterests();
  }, []);

  const handleWithdraw = async (interestId) => {
    setActionId(interestId);
    try {
      const res = await withdrawInterest(interestId);
      if (res.success) {
        await fetchInterests();
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to withdraw interest.');
    } finally {
      setActionId(null);
    }
  };

  if (loading) {
    return (
      <div className="container" style={{ paddingTop: '3rem', textAlign: 'center' }}>
        <p style={{ color: '#6b7280' }}>Loading your donation interests...</p>
      </div>
    );
  }

  return (
    <div className="container" style={{ paddingTop: '2rem', paddingBottom: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 700, color: '#111827', marginBottom: '0.25rem' }}>
            My Food Interests
          </h1>
          <p style={{ color: '#4b5563', fontSize: '1rem' }}>
            Track the food donation offerings you have expressed interest in receiving.
          </p>
        </div>
        <Link
          to="/customer/donations"
          className="btn btn-primary"
          style={{ width: 'auto', padding: '0.6rem 1.25rem', fontSize: '0.9rem' }}
        >
          View Available Food
        </Link>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {interests.length === 0 ? (
        <div
          style={{
            backgroundColor: '#ffffff',
            padding: '4rem 2rem',
            borderRadius: '8px',
            textAlign: 'center',
            border: '1px solid #e5e7eb',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
          }}
        >
          <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#374151', marginBottom: '0.5rem' }}>
            You haven't expressed interest in any food donations yet.
          </h3>
          <p style={{ color: '#6b7280', marginBottom: '1.5rem', fontSize: '0.95rem' }}>
            Explore available surplus food offerings posted by donors in your region.
          </p>
          <Link
            to="/customer/donations"
            className="btn btn-primary"
            style={{ display: 'inline-block', width: 'auto', padding: '0.7rem 1.5rem' }}
          >
            Explore Available Food
          </Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {interests.map((item) => {
            const donation = item.donation || {};
            const badge = statusBadgeConfig[item.status] || {
              label: item.status,
              bg: '#f3f4f6',
              color: '#374151',
              border: '#e5e7eb',
            };

            return (
              <div
                key={item.id}
                style={{
                  backgroundColor: '#ffffff',
                  padding: '1.5rem',
                  borderRadius: '8px',
                  border: '1px solid #e5e7eb',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
                  display: 'flex',
                  justify: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '1rem',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#6b7280' }}>
                      DONATION #D-{(donation.id || item.donation || '').slice(-6).toUpperCase()}
                    </span>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#111827', margin: 0 }}>
                      {donation.quantity || 0} Meals — {donation.foodType || 'Food Supply'}
                    </h3>
                    <span
                      style={{
                        backgroundColor: badge.bg,
                        color: badge.color,
                        border: `1px solid ${badge.border}`,
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        padding: '0.25rem 0.65rem',
                        borderRadius: '12px',
                        textTransform: 'uppercase',
                      }}
                    >
                      {badge.label}
                    </span>
                  </div>
                  <p style={{ color: '#4b5563', fontSize: '0.9rem', margin: '0.25rem 0' }}>
                    <strong>Location:</strong> {donation.location || 'N/A'}
                  </p>
                  <p style={{ color: '#6b7280', fontSize: '0.85rem', margin: 0 }}>
                    Expressed on: {new Date(item.createdAt).toLocaleDateString()} | Available: {donation.availableDate ? new Date(donation.availableDate).toLocaleDateString() : 'N/A'} at {donation.availableTime || ''}
                  </p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  {item.status === 'INTERESTED' && (
                    <button
                      onClick={() => handleWithdraw(item.id)}
                      disabled={actionId === item.id}
                      style={{
                        backgroundColor: '#ffffff',
                        color: '#dc2626',
                        border: '1px solid #fca5a5',
                        padding: '0.5rem 0.9rem',
                        borderRadius: '6px',
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        cursor: actionId === item.id ? 'not-allowed' : 'pointer',
                      }}
                    >
                      {actionId === item.id ? 'Withdrawing...' : 'Withdraw'}
                    </button>
                  )}
                  {donation.id && (
                    <Link
                      to={`/customer/donations/${donation.id}`}
                      style={{
                        backgroundColor: '#f3f4f6',
                        color: '#374151',
                        padding: '0.55rem 1.1rem',
                        borderRadius: '6px',
                        fontSize: '0.875rem',
                        fontWeight: 600,
                        transition: 'background-color 0.15s',
                      }}
                    >
                      View Offering
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MyDonationInterests;
