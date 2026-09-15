import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getMyFoodRequests } from '../../features/customer/services/foodRequestService';

const MyRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const res = await getMyFoodRequests();
        if (res.success) {
          setRequests(res.data || []);
        }
      } catch (err) {
        setError(err.message || 'Failed to load food requests.');
      } finally {
        setLoading(false);
      }
    };

    fetchRequests();
  }, []);

  if (loading) {
    return (
      <div className="container" style={{ paddingTop: '3rem', textAlign: 'center' }}>
        <p style={{ color: '#6b7280' }}>Loading your food requests...</p>
      </div>
    );
  }

  return (
    <div className="container" style={{ paddingTop: '2rem', paddingBottom: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 700, color: '#111827', marginBottom: '0.25rem' }}>
            My Food Requests
          </h1>
          <p style={{ color: '#4b5563', fontSize: '1rem' }}>
            Track your active and completed food requirements.
          </p>
        </div>
        <Link
          to="/customer/request-food"
          className="btn btn-primary"
          style={{ width: 'auto', padding: '0.6rem 1.25rem', fontSize: '0.9rem' }}
        >
          Request Food
        </Link>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {requests.length === 0 ? (
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
            No food requests yet.
          </h3>
          <p style={{ color: '#6b7280', marginBottom: '1.5rem', fontSize: '0.95rem' }}>
            You haven't submitted any food requirements. Click below to post your first request.
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {requests.map((req) => (
            <div
              key={req.id}
              style={{
                backgroundColor: '#ffffff',
                padding: '1.5rem',
                borderRadius: '8px',
                border: '1px solid #e5e7eb',
                boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '1rem',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#111827', margin: 0 }}>
                    {req.peopleCount} People — {req.foodType}
                  </h3>
                  <span
                    style={{
                      backgroundColor: '#dcfce7',
                      color: '#15803d',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      padding: '0.2rem 0.6rem',
                      borderRadius: '12px',
                    }}
                  >
                    {req.status}
                  </span>
                </div>
                <p style={{ color: '#4b5563', fontSize: '0.9rem', margin: '0.25rem 0' }}>
                  <strong>Location:</strong> {req.location}
                </p>
                <p style={{ color: '#6b7280', fontSize: '0.85rem', margin: 0 }}>
                  Required Date: {new Date(req.requiredDate).toLocaleDateString()} at {req.requiredTime} | Posted on: {new Date(req.createdAt).toLocaleDateString()}
                </p>
              </div>

              <Link
                to={`/customer/requests/${req.id}`}
                style={{
                  backgroundColor: '#f3f4f6',
                  color: '#374151',
                  padding: '0.5rem 1rem',
                  borderRadius: '6px',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  transition: 'background-color 0.15s',
                }}
              >
                View Details
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyRequests;
