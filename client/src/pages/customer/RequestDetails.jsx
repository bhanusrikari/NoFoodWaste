import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getFoodRequestById } from '../../features/customer/services/foodRequestService';
import RequestStatusBadge from '../../features/customer/components/RequestStatusBadge';
import RequestProgressTimeline from '../../features/customer/components/RequestProgressTimeline';
import DeliveryTrackingMap from '../../features/customer/components/DeliveryTrackingMap';
import { useAuth } from '../../features/auth/authContext';
import {
  connectSocket,
  joinTrackingRoom,
  subscribeLocationUpdates,
  unsubscribeLocationUpdates,
  disconnectSocket,
} from '../../services/socketService';

const RequestDetails = () => {
  const { id } = useParams();
  const { token } = useAuth();
  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Live Tracking State
  const [liveLocation, setLiveLocation] = useState(null);
  const [socketStatus, setSocketStatus] = useState('Disconnected');
  const [lastUpdated, setLastUpdated] = useState(null);

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const res = await getFoodRequestById(id);
        if (res.success) {
          setRequest(res.data);
          if (res.data.currentLocation) {
            setLiveLocation(res.data.currentLocation);
            setLastUpdated(res.data.currentLocation.updatedAt);
          }
        }
      } catch (err) {
        setError(err.message || 'Failed to load request details.');
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [id]);

  // Establish Socket.IO Connection & Join Room if status requires live tracking
  useEffect(() => {
    if (!request || !token) return;

    const isTrackingActive = ['DELIVERY_ASSIGNED', 'OUT_FOR_DELIVERY'].includes(request.status);

    if (!isTrackingActive) return;

    setSocketStatus('Connecting...');
    const socket = connectSocket(token);

    socket.on('connect', () => {
      setSocketStatus('Live');
      joinTrackingRoom(request.id);
    });

    socket.on('disconnect', () => {
      setSocketStatus('Disconnected');
    });

    socket.on('tracking:joined', () => {
      setSocketStatus('Live');
    });

    socket.on('tracking:error', (errData) => {
      setSocketStatus('Location Unavailable');
      console.warn('[Tracking Socket] Room join error:', errData.message);
    });

    const handleLocationUpdate = (data) => {
      if (data.requestId === request.id) {
        setLiveLocation({
          latitude: data.latitude,
          longitude: data.longitude,
          updatedAt: data.timestamp,
        });
        setLastUpdated(data.timestamp);
      }
    };

    subscribeLocationUpdates(handleLocationUpdate);

    return () => {
      unsubscribeLocationUpdates(handleLocationUpdate);
      disconnectSocket();
    };
  }, [request, token]);

  if (loading) {
    return (
      <div className="container" style={{ paddingTop: '3rem', textAlign: 'center' }}>
        <p style={{ color: '#6b7280' }}>Loading food request details...</p>
      </div>
    );
  }

  if (error || !request) {
    return (
      <div className="container" style={{ paddingTop: '2rem' }}>
        <div className="alert alert-danger">{error || 'Food request not found or access denied.'}</div>
        <Link to="/customer/requests" style={{ color: '#10b981', fontWeight: 600 }}>
          &larr; Back to My Requests
        </Link>
      </div>
    );
  }

  const isTrackingActive = ['DELIVERY_ASSIGNED', 'OUT_FOR_DELIVERY'].includes(request.status);

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
          maxWidth: '820px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid #f3f4f6', paddingBottom: '1rem' }}>
          <div>
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#6b7280' }}>
              FOOD REQUIREMENT
            </span>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#111827', margin: '0.2rem 0 0 0' }}>
              Request #FR-{request.id.slice(-6).toUpperCase()}
            </h1>
          </div>
          <RequestStatusBadge status={request.status} />
        </div>

        {/* Progress Timeline Component */}
        <RequestProgressTimeline status={request.status} />

        {/* Live Delivery Tracking Panel (Rendered when status is DELIVERY_ASSIGNED or OUT_FOR_DELIVERY) */}
        {isTrackingActive && (
          <section
            style={{
              backgroundColor: '#f8fafc',
              border: '1px solid #cbd5e1',
              borderRadius: '8px',
              padding: '1.5rem',
              marginBottom: '2rem',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span
                  style={{
                    width: '10px',
                    height: '10px',
                    borderRadius: '50%',
                    backgroundColor: socketStatus === 'Live' ? '#10b981' : '#f59e0b',
                    display: 'inline-block',
                  }}
                />
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                  Live Delivery Tracking
                </h3>
              </div>
              <span
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  color: socketStatus === 'Live' ? '#047857' : '#b45309',
                  backgroundColor: socketStatus === 'Live' ? '#d1fae5' : '#fef3c7',
                  padding: '0.25rem 0.6rem',
                  borderRadius: '12px',
                  textTransform: 'uppercase',
                }}
              >
                {socketStatus}
              </span>
            </div>

            {/* Volunteer & Vehicle Information (if available) */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
              <div style={{ backgroundColor: '#ffffff', padding: '1rem', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                <p style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', margin: '0 0 0.25rem 0', textTransform: 'uppercase' }}>
                  Assigned Volunteer
                </p>
                <p style={{ fontSize: '0.95rem', fontWeight: 600, color: '#0f172a', margin: 0 }}>
                  {request.assignedVolunteer?.name || 'Volunteer Assigned'}
                </p>
                {request.assignedVolunteer?.phone && (
                  <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '0.2rem 0 0 0' }}>
                    Contact: {request.assignedVolunteer.phone}
                  </p>
                )}
              </div>

              <div style={{ backgroundColor: '#ffffff', padding: '1rem', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                <p style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', margin: '0 0 0.25rem 0', textTransform: 'uppercase' }}>
                  Assigned Vehicle
                </p>
                <p style={{ fontSize: '0.95rem', fontWeight: 600, color: '#0f172a', margin: 0 }}>
                  {request.assignedVehicle?.type ? `${request.assignedVehicle.type} (${request.assignedVehicle.registrationNumber || 'Registered'})` : 'Delivery Vehicle Assigned'}
                </p>
              </div>

              {request.eta?.minutes && (
                <div style={{ backgroundColor: '#ffffff', padding: '1rem', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                  <p style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', margin: '0 0 0.25rem 0', textTransform: 'uppercase' }}>
                    Estimated Arrival (ETA)
                  </p>
                  <p style={{ fontSize: '0.95rem', fontWeight: 700, color: '#10b981', margin: 0 }}>
                    ~{request.eta.minutes} mins
                  </p>
                </div>
              )}
            </div>

            {/* Interactive / Dynamic Map Component */}
            <DeliveryTrackingMap
              vehicleLocation={liveLocation}
              destinationCoords={request.destinationCoords}
              pickupCoords={request.pickupCoords}
              locationText={request.location}
            />

            {lastUpdated && (
              <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '0.5rem 0 0 0', textAlign: 'right' }}>
                Last location update: {new Date(lastUpdated).toLocaleTimeString()}
              </p>
            )}
          </section>
        )}

        <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#374151', marginBottom: '1rem', borderBottom: '1px solid #f3f4f6', paddingBottom: '0.5rem' }}>
          Requirement Attributes
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
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
            <p style={{ fontSize: '0.95rem', color: '#374151', margin: '0.2rem 0', backgroundColor: '#f9fafb', padding: '0.85rem', borderRadius: '6px', border: '1px solid #f3f4f6' }}>
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
