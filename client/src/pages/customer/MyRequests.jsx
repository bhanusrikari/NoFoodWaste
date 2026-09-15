import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getMyFoodRequests } from '../../features/customer/services/foodRequestService';
import RequestStatusBadge from '../../features/customer/components/RequestStatusBadge';

const MyRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeFilter, setActiveFilter] = useState('ALL');

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

  const filteredRequests = requests.filter((req) => {
    if (activeFilter === 'ALL') return true;
    if (activeFilter === 'OPEN') {
      return ['OPEN', 'MATCHED', 'DELIVERY_ASSIGNED', 'OUT_FOR_DELIVERY'].includes(req.status);
    }
    if (activeFilter === 'COMPLETED') {
      return ['DELIVERED', 'ACKNOWLEDGED'].includes(req.status);
    }
    if (activeFilter === 'CANCELLED') {
      return ['CANCELLED', 'REJECTED'].includes(req.status);
    }
    return true;
  });

  if (loading) {
    return (
      <div className="container" style={{ paddingTop: '3rem', textAlign: 'center' }}>
        <p style={{ color: '#6b7280' }}>Loading your food requests...</p>
      </div>
    );
  }

  return (
    <div className="container" style={{ paddingTop: '2rem', paddingBottom: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 700, color: '#111827', marginBottom: '0.25rem' }}>
            My Food Requests
          </h1>
          <p style={{ color: '#4b5563', fontSize: '1rem' }}>
            Track and manage your submitted food requirements.
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

      {/* Filter Tabs */}
      {requests.length > 0 && (
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '1px solid #e5e7eb', paddingBottom: '0.75rem' }}>
          {[
            { id: 'ALL', label: 'All Requests' },
            { id: 'OPEN', label: 'Open' },
            { id: 'COMPLETED', label: 'Completed' },
            { id: 'CANCELLED', label: 'Cancelled' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveFilter(tab.id)}
              style={{
                backgroundColor: activeFilter === tab.id ? '#10b981' : '#f3f4f6',
                color: activeFilter === tab.id ? '#ffffff' : '#374151',
                border: 'none',
                padding: '0.4rem 0.9rem',
                borderRadius: '6px',
                fontSize: '0.85rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'background-color 0.15s',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}

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
            Create a food requirement and we'll help connect it with available food donations.
          </p>
          <Link
            to="/customer/request-food"
            className="btn btn-primary"
            style={{ display: 'inline-block', width: 'auto', padding: '0.7rem 1.5rem' }}
          >
            Request Food
          </Link>
        </div>
      ) : filteredRequests.length === 0 ? (
        <div
          style={{
            backgroundColor: '#ffffff',
            padding: '3rem 2rem',
            borderRadius: '8px',
            textAlign: 'center',
            border: '1px solid #e5e7eb',
          }}
        >
          <p style={{ color: '#6b7280', margin: 0 }}>No food requests found matching filter "{activeFilter.toLowerCase()}".</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {filteredRequests.map((req) => (
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
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#6b7280' }}>
                    #FR-{req.id.slice(-6).toUpperCase()}
                  </span>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#111827', margin: 0 }}>
                    {req.peopleCount} People — {req.foodType}
                  </h3>
                  <RequestStatusBadge status={req.status} />
                </div>
                <p style={{ color: '#4b5563', fontSize: '0.9rem', margin: '0.25rem 0' }}>
                  <strong>Location:</strong> {req.location}
                </p>
                <p style={{ color: '#6b7280', fontSize: '0.85rem', margin: 0 }}>
                  Required: {new Date(req.requiredDate).toLocaleDateString()} at {req.requiredTime} | Created: {new Date(req.createdAt).toLocaleDateString()}
                </p>
              </div>

              <Link
                to={`/customer/requests/${req.id}`}
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
