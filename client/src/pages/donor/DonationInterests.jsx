import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { donationService } from '../../services/donationService';

const DonationInterests = () => {
  const { id } = useParams();
  const [donation, setDonation] = useState(null);
  const [interests, setInterests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    fetchInterests();
  }, [id]);

  const fetchInterests = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await donationService.getInterests(id);
      if (res.success) {
        setDonation(res.donation);
        setInterests(res.interests || []);
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to load interested customers.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (interestId, newStatus) => {
    try {
      setActionLoading(true);
      setSuccessMessage('');
      setError('');
      const res = await donationService.updateInterestStatus(id, interestId, newStatus);
      if (res.success) {
        setSuccessMessage(`Recipient interest status updated to ${newStatus}`);
        fetchInterests();
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to update interest status.';
      setError(msg);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container" style={{ paddingTop: '3rem', textAlign: 'center' }}>
        <p style={{ color: '#6b7280' }}>Loading donation interests...</p>
      </div>
    );
  }

  if (error && !donation) {
    return (
      <div className="container" style={{ paddingTop: '2rem' }}>
        <div className="alert alert-danger">{error}</div>
        <Link to="/donor/dashboard" style={{ color: '#10b981', fontWeight: 600 }}>
          &larr; Back to Donor Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="container" style={{ paddingTop: '2rem', paddingBottom: '3rem', maxWidth: '860px' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <Link to="/donor/dashboard" style={{ color: '#10b981', fontWeight: 600, fontSize: '0.9rem' }}>
          &larr; Back to Donor Dashboard
        </Link>
      </div>

      {donation && (
        <div
          style={{
            backgroundColor: '#ffffff',
            padding: '1.75rem',
            borderRadius: '10px',
            border: '1px solid #e5e7eb',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
            marginBottom: '2rem',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#6b7280' }}>
              DONATION #D-{donation.id.slice(-6).toUpperCase()}
            </span>
            <span
              style={{
                backgroundColor: '#f0fdf4',
                color: '#15803d',
                border: '1px solid #bbf7d0',
                fontSize: '0.75rem',
                fontWeight: 700,
                padding: '0.2rem 0.6rem',
                borderRadius: '12px',
                textTransform: 'uppercase',
              }}
            >
              {donation.status}
            </span>
          </div>

          <h1 style={{ fontSize: '1.6rem', fontWeight: 700, color: '#111827', margin: '0 0 0.5rem 0' }}>
            {donation.quantity} {donation.unit || 'Meals'} — {donation.foodType}
          </h1>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginTop: '1rem', fontSize: '0.9rem', color: '#4b5563' }}>
            <div><strong>Cuisine:</strong> {donation.cuisine}</div>
            <div><strong>Pickup Address:</strong> {donation.pickupAddress}</div>
            <div><strong>Available:</strong> {donation.availableTime}</div>
          </div>
        </div>
      )}

      {successMessage && <div className="alert alert-success">{successMessage}</div>}
      {error && <div className="alert alert-danger">{error}</div>}

      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#111827', marginBottom: '0.25rem' }}>
          Interested Customers / Recipients ({interests.length})
        </h2>
        <p style={{ color: '#6b7280', fontSize: '0.95rem' }}>
          Customers who expressed interest in receiving this surplus food supply.
        </p>
      </div>

      {interests.length === 0 ? (
        <div
          style={{
            backgroundColor: '#ffffff',
            padding: '3rem 2rem',
            borderRadius: '8px',
            textAlign: 'center',
            border: '1px solid #e5e7eb',
          }}
        >
          <p style={{ color: '#6b7280', fontSize: '1rem', margin: 0 }}>
            No customers have expressed interest in this donation yet.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {interests.map((interest) => {
            const isSelected = interest.status === 'SELECTED';
            const isRejected = interest.status === 'REJECTED';
            const isWithdrawn = interest.status === 'WITHDRAWN';

            let badgeBg = '#dbeafe';
            let badgeColor = '#1e40af';
            if (isSelected) {
              badgeBg = '#d1fae5';
              badgeColor = '#065f46';
            } else if (isRejected) {
              badgeBg = '#fee2e2';
              badgeColor = '#991b1b';
            } else if (isWithdrawn) {
              badgeBg = '#f3f4f6';
              badgeColor = '#6b7280';
            }

            return (
              <div
                key={interest.id}
                style={{
                  backgroundColor: '#ffffff',
                  padding: '1.5rem',
                  borderRadius: '8px',
                  border: `1.5px solid ${isSelected ? '#10b981' : '#e5e7eb'}`,
                  boxShadow: '0 2px 6px rgba(0, 0, 0, 0.03)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '1rem',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.35rem' }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#111827', margin: 0 }}>
                      {interest.customerName || 'Interested Customer'}
                    </h3>
                    <span
                      style={{
                        backgroundColor: badgeBg,
                        color: badgeColor,
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        padding: '0.2rem 0.6rem',
                        borderRadius: '12px',
                        textTransform: 'uppercase',
                      }}
                    >
                      {interest.status}
                    </span>
                  </div>

                  {interest.customerEmail && (
                    <p style={{ color: '#4b5563', fontSize: '0.88rem', margin: '0.2rem 0' }}>
                      <strong>Email:</strong> {interest.customerEmail}
                    </p>
                  )}
                  {interest.customerPhone && (
                    <p style={{ color: '#4b5563', fontSize: '0.88rem', margin: '0.2rem 0' }}>
                      <strong>Phone:</strong> {interest.customerPhone}
                    </p>
                  )}

                  <p style={{ color: '#9ca3af', fontSize: '0.78rem', margin: '0.35rem 0 0 0' }}>
                    Expressed interest on {new Date(interest.createdAt).toLocaleString()}
                  </p>
                </div>

                {!isWithdrawn && (
                  <div style={{ display: 'flex', gap: '0.6rem' }}>
                    {!isSelected && (
                      <button
                        onClick={() => handleUpdateStatus(interest.id, 'SELECTED')}
                        disabled={actionLoading}
                        className="btn btn-primary"
                        style={{
                          padding: '0.45rem 0.9rem',
                          fontSize: '0.85rem',
                          backgroundColor: '#10b981',
                          borderColor: '#10b981',
                        }}
                      >
                        Select Recipient
                      </button>
                    )}
                    {!isRejected && (
                      <button
                        onClick={() => handleUpdateStatus(interest.id, 'REJECTED')}
                        disabled={actionLoading}
                        className="btn"
                        style={{
                          padding: '0.45rem 0.9rem',
                          fontSize: '0.85rem',
                          backgroundColor: '#f3f4f6',
                          color: '#4b5563',
                          border: '1px solid #d1d5db',
                        }}
                      >
                        Reject
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default DonationInterests;
