import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getDonationById, expressInterest, withdrawInterest } from '../../features/customer/services/donationService';

const DonationDetails = () => {
  const { id } = useParams();
  const [donation, setDonation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState('');

  useEffect(() => {
    const fetchDonation = async () => {
      try {
        const res = await getDonationById(id);
        if (res.success) {
          setDonation(res.data);
        }
      } catch (err) {
        setError(err.message || 'Failed to load donation details.');
      } finally {
        setLoading(false);
      }
    };

    fetchDonation();
  }, [id]);

  const handleExpressInterest = async () => {
    setActionLoading(true);
    setActionMessage('');
    setError('');
    try {
      const res = await expressInterest(id);
      if (res.success) {
        setActionMessage('Interest registered successfully!');
        // Refresh donation details to update myInterest state
        const updated = await getDonationById(id);
        if (updated.success) {
          setDonation(updated.data);
        }
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to express interest.';
      setError(msg);
    } finally {
      setActionLoading(false);
    }
  };

  const handleWithdrawInterest = async () => {
    if (!donation?.myInterest?.id) return;
    setActionLoading(true);
    setActionMessage('');
    setError('');
    try {
      const res = await withdrawInterest(donation.myInterest.id);
      if (res.success) {
        setActionMessage('Interest withdrawn successfully.');
        const updated = await getDonationById(id);
        if (updated.success) {
          setDonation(updated.data);
        }
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to withdraw interest.';
      setError(msg);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container" style={{ paddingTop: '3rem', textAlign: 'center' }}>
        <p style={{ color: '#6b7280' }}>Loading donation details...</p>
      </div>
    );
  }

  if (error && !donation) {
    return (
      <div className="container" style={{ paddingTop: '2rem' }}>
        <div className="alert alert-danger">{error || 'Donation opportunity not found.'}</div>
        <Link to="/customer/donations" style={{ color: '#10b981', fontWeight: 600 }}>
          &larr; Back to Available Food
        </Link>
      </div>
    );
  }

  const isAvailable = donation.status === 'AVAILABLE';
  const myInterest = donation.myInterest;

  return (
    <div className="container" style={{ paddingTop: '2rem', paddingBottom: '2rem' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <Link to="/customer/donations" style={{ color: '#10b981', fontWeight: 600, fontSize: '0.9rem' }}>
          &larr; Back to Available Food
        </Link>
      </div>

      <div
        style={{
          backgroundColor: '#ffffff',
          padding: '2.5rem',
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
          border: '1px solid #e5e7eb',
          maxWidth: '820px',
        }}
      >
        <div
          style={{
            display: 'flex',
            justify: 'space-between',
            alignItems: 'center',
            marginBottom: '1.5rem',
            borderBottom: '1px solid #f3f4f6',
            paddingBottom: '1rem',
          }}
        >
          <div>
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#6b7280' }}>
              FOOD DONATION OPPORTUNITY
            </span>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#111827', margin: '0.2rem 0 0 0' }}>
              Donation #D-{donation.id.slice(-6).toUpperCase()}
            </h1>
          </div>
          <span
            style={{
              backgroundColor: isAvailable ? '#f0fdf4' : '#f3f4f6',
              color: isAvailable ? '#15803d' : '#4b5563',
              border: `1px solid ${isAvailable ? '#bbf7d0' : '#e5e7eb'}`,
              fontSize: '0.75rem',
              fontWeight: 700,
              padding: '0.25rem 0.65rem',
              borderRadius: '12px',
              textTransform: 'uppercase',
            }}
          >
            {donation.status}
          </span>
        </div>

        {actionMessage && <div className="alert alert-success">{actionMessage}</div>}
        {error && <div className="alert alert-danger">{error}</div>}

        {/* Dynamic Action & Status Card */}
        <section
          style={{
            backgroundColor: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            padding: '1.5rem',
            marginBottom: '2rem',
          }}
        >
          {!isAvailable ? (
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#475569', margin: '0 0 0.25rem 0' }}>
                Donation Unavailable
              </h3>
              <p style={{ color: '#64748b', fontSize: '0.95rem', margin: 0 }}>
                This donation is no longer available for expressing interest.
              </p>
            </div>
          ) : myInterest && myInterest.status === 'SELECTED' ? (
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#15803d', margin: '0 0 0.25rem 0' }}>
                You're Selected!
              </h3>
              <p style={{ color: '#166534', fontSize: '0.95rem', margin: 0 }}>
                You have been selected for this food donation. Fulfillment and distribution details will be updated as delivery proceeds.
              </p>
            </div>
          ) : myInterest && myInterest.status === 'INTERESTED' ? (
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f766e', margin: '0 0 0.25rem 0' }}>
                Interest Registered
              </h3>
              <p style={{ color: '#134e4a', fontSize: '0.95rem', marginBottom: '1rem' }}>
                You have expressed interest in this food donation. The donor or administrator will review interested recipients.
              </p>
              <button
                onClick={handleWithdrawInterest}
                disabled={actionLoading}
                style={{
                  backgroundColor: '#ffffff',
                  color: '#dc2626',
                  border: '1px solid #fca5a5',
                  padding: '0.5rem 1rem',
                  borderRadius: '6px',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  cursor: actionLoading ? 'not-allowed' : 'pointer',
                }}
              >
                {actionLoading ? 'Withdrawing...' : 'Withdraw Interest'}
              </button>
            </div>
          ) : myInterest && myInterest.status === 'REJECTED' ? (
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#991b1b', margin: '0 0 0.25rem 0' }}>
                Not Selected
              </h3>
              <p style={{ color: '#7f1d1d', fontSize: '0.95rem', margin: 0 }}>
                Another recipient was selected for this donation opportunity.
              </p>
            </div>
          ) : (
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', margin: '0 0 0.5rem 0' }}>
                Interested in this Food Offering?
              </h3>
              <p style={{ color: '#475569', fontSize: '0.95rem', marginBottom: '1.25rem' }}>
                Click below to notify the donor/admin that your group is interested in receiving this food supply.
              </p>
              <button
                onClick={handleExpressInterest}
                disabled={actionLoading}
                className="btn btn-primary"
                style={{
                  width: 'auto',
                  padding: '0.65rem 1.4rem',
                  fontSize: '0.95rem',
                  backgroundColor: '#10b981',
                  borderColor: '#10b981',
                  fontWeight: 600,
                }}
              >
                {actionLoading ? 'Submitting...' : "I'm Interested"}
              </button>
            </div>
          )}
        </section>

        <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#374151', marginBottom: '1rem', borderBottom: '1px solid #f3f4f6', paddingBottom: '0.5rem' }}>
          Donation Attributes
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
          <div>
            <p style={{ fontSize: '0.85rem', color: '#6b7280', margin: 0 }}>Quantity Available</p>
            <p style={{ fontSize: '1.1rem', fontWeight: 600, color: '#111827', margin: '0.2rem 0' }}>{donation.quantity} Meals</p>
          </div>

          <div>
            <p style={{ fontSize: '0.85rem', color: '#6b7280', margin: 0 }}>Food Type</p>
            <p style={{ fontSize: '1.1rem', fontWeight: 600, color: '#111827', margin: '0.2rem 0' }}>{donation.foodType}</p>
          </div>

          <div>
            <p style={{ fontSize: '0.85rem', color: '#6b7280', margin: 0 }}>Available Date</p>
            <p style={{ fontSize: '1rem', fontWeight: 600, color: '#111827', margin: '0.2rem 0' }}>
              {new Date(donation.availableDate).toLocaleDateString()}
            </p>
          </div>

          <div>
            <p style={{ fontSize: '0.85rem', color: '#6b7280', margin: 0 }}>Available Time</p>
            <p style={{ fontSize: '1rem', fontWeight: 600, color: '#111827', margin: '0.2rem 0' }}>{donation.availableTime}</p>
          </div>
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <p style={{ fontSize: '0.85rem', color: '#6b7280', margin: 0 }}>Pickup Location</p>
          <p style={{ fontSize: '1rem', fontWeight: 600, color: '#111827', margin: '0.2rem 0' }}>{donation.location}</p>
        </div>

        {donation.notes && (
          <div style={{ marginBottom: '1.5rem' }}>
            <p style={{ fontSize: '0.85rem', color: '#6b7280', margin: 0 }}>Additional Information / Description</p>
            <p style={{ fontSize: '0.95rem', color: '#374151', margin: '0.2rem 0', backgroundColor: '#f9fafb', padding: '0.85rem', borderRadius: '6px', border: '1px solid #f3f4f6' }}>
              {donation.notes}
            </p>
          </div>
        )}

        <div style={{ borderTop: '1px solid #f3f4f6', paddingTop: '1rem', marginTop: '1.5rem' }}>
          <p style={{ fontSize: '0.8rem', color: '#9ca3af', margin: 0 }}>
            Posted: {new Date(donation.createdAt).toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  );
};

export default DonationDetails;
