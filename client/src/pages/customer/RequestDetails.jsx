import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getFoodRequestById } from '../../features/customer/services/foodRequestService';

const RequestDetails = () => {
  const { id } = useParams();
  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const res = await getFoodRequestById(id);
        if (res.success) {
          setRequest(res.data);
        }
      } catch (err) {
        setError(err.message || 'Failed to load request details.');
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [id]);

  if (loading) {
    return (
      <div className="container" style={{ paddingTop: '3rem', textAlign: 'center' }}>
        <p style={{ color: '#6b7280' }}>Loading request details...</p>
      </div>
    );
  }

  if (error || !request) {
    return (
      <div className="container" style={{ paddingTop: '2rem' }}>
        <div className="alert alert-danger">{error || 'Food request not found.'}</div>
        <Link to="/customer/requests" style={{ color: '#10b981', fontWeight: 600 }}>
          &larr; Back to My Requests
        </Link>
      </div>
    );
  }

  return (
    <div className="container" style={{ paddingTop: '2rem', paddingBottom: '2rem' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <Link to="/customer/requests" style={{ color: '#10b981', fontWeight: 600, fontSize: '0.9rem' }}>
          &larr; Back to My Requests
        </Link>
      </div>

      <div
        style={{
          backgroundColor: '#ffffff',
          padding: '2.5rem',
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
          border: '1px solid #e5e7eb',
          maxWidth: '720px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid #f3f4f6', paddingBottom: '1rem' }}>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#111827', margin: 0 }}>
            Request #{request.id.slice(-6).toUpperCase()}
          </h1>
          <span
            style={{
              backgroundColor: '#dcfce7',
              color: '#15803d',
              fontSize: '0.85rem',
              fontWeight: 700,
              padding: '0.3rem 0.8rem',
              borderRadius: '16px',
            }}
          >
            {request.status}
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
          <div>
            <p style={{ fontSize: '0.85rem', color: '#6b7280', margin: 0 }}>People Required</p>
            <p style={{ fontSize: '1.1rem', fontWeight: 600, color: '#111827', margin: '0.2rem 0' }}>{request.peopleCount} People</p>
          </div>

          <div>
            <p style={{ fontSize: '0.85rem', color: '#6b7280', margin: 0 }}>Food Type</p>
            <p style={{ fontSize: '1.1rem', fontWeight: 600, color: '#111827', margin: '0.2rem 0' }}>{request.foodType}</p>
          </div>

          <div>
            <p style={{ fontSize: '0.85rem', color: '#6b7280', margin: 0 }}>Required Date</p>
            <p style={{ fontSize: '1rem', fontWeight: 600, color: '#111827', margin: '0.2rem 0' }}>
              {new Date(request.requiredDate).toLocaleDateString()}
            </p>
          </div>

          <div>
            <p style={{ fontSize: '0.85rem', color: '#6b7280', margin: 0 }}>Required Time</p>
            <p style={{ fontSize: '1rem', fontWeight: 600, color: '#111827', margin: '0.2rem 0' }}>{request.requiredTime}</p>
          </div>
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <p style={{ fontSize: '0.85rem', color: '#6b7280', margin: 0 }}>Delivery Location</p>
          <p style={{ fontSize: '1rem', fontWeight: 600, color: '#111827', margin: '0.2rem 0' }}>{request.location}</p>
        </div>

        {request.notes && (
          <div style={{ marginBottom: '1.5rem' }}>
            <p style={{ fontSize: '0.85rem', color: '#6b7280', margin: 0 }}>Additional Notes</p>
            <p style={{ fontSize: '0.95rem', color: '#374151', margin: '0.2rem 0', backgroundColor: '#f9fafb', padding: '0.75rem', borderRadius: '6px' }}>
              {request.notes}
            </p>
          </div>
        )}

        <div style={{ borderTop: '1px solid #f3f4f6', paddingTop: '1rem', marginTop: '1.5rem' }}>
          <p style={{ fontSize: '0.8rem', color: '#9ca3af', margin: 0 }}>
            Created: {new Date(request.createdAt).toLocaleString()} | Last Updated: {new Date(request.updatedAt).toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  );
};

export default RequestDetails;
