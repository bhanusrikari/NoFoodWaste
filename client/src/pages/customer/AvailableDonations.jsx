import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getAvailableDonations } from '../../features/customer/services/donationService';

const AvailableDonations = () => {
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDonations = async () => {
      try {
        const res = await getAvailableDonations();
        if (res.success) {
          setDonations(res.data || []);
        }
      } catch (err) {
        setError(err.message || 'Failed to load food donations.');
      } finally {
        setLoading(false);
      }
    };

    fetchDonations();
  }, []);

  if (loading) {
    return (
      <div className="container" style={{ paddingTop: '3rem', textAlign: 'center' }}>
        <p style={{ color: '#6b7280' }}>Loading available food donations...</p>
      </div>
    );
  }

  return (
    <div className="container" style={{ paddingTop: '2rem', paddingBottom: '2rem' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 700, color: '#111827', marginBottom: '0.25rem' }}>
          Available Food Donations
        </h1>
        <p style={{ color: '#4b5563', fontSize: '1rem' }}>
          Food donors are offering surplus meals. Express interest to be considered for distribution.
        </p>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {donations.length === 0 ? (
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
            No food donations are currently available.
          </h3>
          <p style={{ color: '#6b7280', marginBottom: '1.5rem', fontSize: '0.95rem' }}>
            Check back later for new surplus food offerings or post a food requirement for your group.
          </p>
          <Link
            to="/customer/request-food"
            className="btn btn-primary"
            style={{ display: 'inline-block', width: 'auto', padding: '0.7rem 1.5rem' }}
          >
            Request Food
          </Link>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
          {donations.map((donation) => (
            <div
              key={donation.id}
              style={{
                backgroundColor: '#ffffff',
                padding: '1.75rem',
                borderRadius: '8px',
                border: '1px solid #e5e7eb',
                boxShadow: '0 2px 6px rgba(0, 0, 0, 0.04)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div>
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
                    AVAILABLE
                  </span>
                </div>

                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#111827', margin: '0 0 0.5rem 0' }}>
                  {donation.quantity} Meals — {donation.foodType}
                </h3>

                <p style={{ color: '#4b5563', fontSize: '0.9rem', margin: '0.35rem 0' }}>
                  <strong>Location:</strong> {donation.location}
                </p>

                <p style={{ color: '#6b7280', fontSize: '0.85rem', margin: '0.35rem 0' }}>
                  <strong>Available:</strong> {new Date(donation.availableDate).toLocaleDateString()} at {donation.availableTime}
                </p>

                {donation.notes && (
                  <p style={{ color: '#6b7280', fontSize: '0.85rem', margin: '0.5rem 0 0 0', fontStyle: 'italic' }}>
                    "{donation.notes.length > 80 ? `${donation.notes.substring(0, 80)}...` : donation.notes}"
                  </p>
                )}
              </div>

              <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid #f3f4f6' }}>
                <Link
                  to={`/customer/donations/${donation.id}`}
                  style={{
                    display: 'block',
                    textAlign: 'center',
                    backgroundColor: '#10b981',
                    color: '#ffffff',
                    padding: '0.6rem 1.1rem',
                    borderRadius: '6px',
                    fontSize: '0.9rem',
                    fontWeight: 600,
                    transition: 'background-color 0.15s',
                  }}
                >
                  View Details
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AvailableDonations;
