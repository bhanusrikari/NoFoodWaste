import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import volunteerService from '../../features/volunteer/volunteerService';
import AssignmentTimeline from '../../components/volunteer/AssignmentTimeline';
import '../../features/volunteer/volunteer.css';

const AssignmentDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [assignment, setAssignment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const loadAssignment = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const res = await volunteerService.getAssignment(id);
      setAssignment(res.assignment);
    } catch (err) {
      setError(err.message || 'Unable to load assignment.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadAssignment();
  }, [loadAssignment]);

  const handleAccept = async () => {
    try {
      setActionLoading(true);
      setError('');
      const res = await volunteerService.acceptAssignment(id);
      setAssignment(res.assignment);
      setSuccessMsg('Task accepted successfully!');
    } catch (err) {
      if (err.message.includes('already been accepted') || err.message.includes('no longer available')) {
        setError(err.message);
        // Refresh to get latest state
        loadAssignment();
      } else {
        setError(err.message);
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleStartPickup = async () => {
    try {
      setActionLoading(true);
      setError('');
      const res = await volunteerService.startPickup(id);
      setAssignment(res.assignment);
      setSuccessMsg('Pickup started!');
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleStartTransport = async () => {
    try {
      setActionLoading(true);
      setError('');
      const res = await volunteerService.startTransport(id);
      setAssignment(res.assignment);
      setSuccessMsg('Transport started!');
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const getNavigationUrl = (lat, lng, address) => {
    if (lat && lng) {
      return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
    }
    if (address) {
      return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`;
    }
    return null;
  };

  if (loading) {
    return (
      <div className="assignment-details">
        <div className="loading-state">
          <span className="loading-spinner"></span>
          Loading assignment details...
        </div>
      </div>
    );
  }

  if (error && !assignment) {
    return (
      <div className="assignment-details">
        <Link to="/volunteer" className="back-link">← Back to Dashboard</Link>
        <div className="error-state">
          <p>⚠️ {error}</p>
        </div>
      </div>
    );
  }

  if (!assignment) return null;

  const shortId = assignment.id.slice(-4).toUpperCase();
  const pickupName = assignment.donorId?.name || 'Unknown Donor';
  const deliveryName = assignment.beneficiaryId?.name || 'Unknown Beneficiary';
  const vehicleNum = assignment.vehicleId?.vehicleNumber || 'N/A';
  const vehicleType = assignment.vehicleId?.vehicleType || 'N/A';
  const vehicleCap = assignment.vehicleId?.capacity || 'N/A';

  const pickupNavUrl = getNavigationUrl(
    assignment.pickupLocation?.latitude,
    assignment.pickupLocation?.longitude,
    assignment.pickupAddress
  );
  const deliveryNavUrl = getNavigationUrl(
    assignment.deliveryLocation?.latitude,
    assignment.deliveryLocation?.longitude,
    assignment.deliveryAddress
  );

  return (
    <div className="assignment-details">
      <Link to="/volunteer" className="back-link">← Back to Dashboard</Link>

      <div className="assignment-details-header">
        <h1>Delivery Task #{shortId}</h1>
        <span className={`status-badge ${assignment.status === 'ASSIGNED' ? 'assigned' :
          assignment.status === 'VOLUNTEER_ACCEPTED' ? 'accepted' :
          assignment.status === 'PICKUP_STARTED' ? 'pickup' :
          assignment.status === 'COLLECTED' ? 'collected' :
          assignment.status === 'IN_TRANSIT' ? 'transit' :
          assignment.status === 'DELIVERED' ? 'delivered' :
          assignment.status === 'COMPLETED' ? 'completed' : 'cancelled'}`}>
          {assignment.status.replace(/_/g, ' ')}
        </span>
      </div>

      {/* Success / Error Messages */}
      {successMsg && (
        <div className="success-message">
          <div className="success-icon">✅</div>
          <h2>{successMsg}</h2>
        </div>
      )}
      {error && (
        <div className="alert alert-danger">{error}</div>
      )}

      {/* Timeline */}
      <AssignmentTimeline currentStatus={assignment.status} />

      {/* Detail Cards */}
      <div className="detail-cards">
        <div className="detail-card">
          <h3>📦 Pickup</h3>
          <p className="detail-name">{pickupName}</p>
          <p className="detail-address">{assignment.pickupAddress}</p>
          {pickupNavUrl && (
            <a href={pickupNavUrl} target="_blank" rel="noopener noreferrer" className="btn-navigate" style={{ marginTop: '0.75rem' }}>
              🧭 Navigate to Pickup
            </a>
          )}
        </div>

        <div className="detail-card">
          <h3>📍 Delivery</h3>
          <p className="detail-name">{deliveryName}</p>
          <p className="detail-address">{assignment.deliveryAddress}</p>
          {deliveryNavUrl && (
            <a href={deliveryNavUrl} target="_blank" rel="noopener noreferrer" className="btn-navigate" style={{ marginTop: '0.75rem' }}>
              🧭 Navigate to Beneficiary
            </a>
          )}
        </div>

        <div className="detail-card">
          <h3>🍽️ Food</h3>
          <p className="detail-value">
            {typeof assignment.quantity === 'object'
              ? `${assignment.quantity.value} ${assignment.quantity.unit}`
              : `${assignment.quantity} meals`}
          </p>
          <p className="detail-address">{assignment.foodType}</p>
        </div>

        <div className="detail-card">
          <h3>🚚 Vehicle</h3>
          <p className="detail-value">{vehicleNum}</p>
          <p className="detail-address">{vehicleType} · Capacity: {vehicleCap}</p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="action-section">
        <h3>Actions</h3>
        <div className="action-buttons">
          {assignment.status === 'ASSIGNED' && (
            <button
              className="btn-action btn-accept"
              onClick={handleAccept}
              disabled={actionLoading}
            >
              {actionLoading ? '⏳ Accepting...' : '✋ Accept Task'}
            </button>
          )}

          {assignment.status === 'VOLUNTEER_ACCEPTED' && (
            <>
              {pickupNavUrl && (
                <a href={pickupNavUrl} target="_blank" rel="noopener noreferrer" className="btn-navigate">
                  🧭 Navigate to Pickup
                </a>
              )}
              <button
                className="btn-action btn-pickup"
                onClick={handleStartPickup}
                disabled={actionLoading}
              >
                {actionLoading ? '⏳ Starting...' : '📦 Start Pickup'}
              </button>
            </>
          )}

          {assignment.status === 'PICKUP_STARTED' && (
            <button
              className="btn-action btn-collect"
              onClick={() => navigate(`/volunteer/assignments/${id}/verify`)}
              disabled={actionLoading}
            >
              🔍 Food Safety Verification
            </button>
          )}

          {assignment.status === 'COLLECTED' && (
            <button
              className="btn-action btn-transport"
              onClick={handleStartTransport}
              disabled={actionLoading}
            >
              {actionLoading ? '⏳ Starting...' : '🚚 Start Transport'}
            </button>
          )}

          {assignment.status === 'IN_TRANSIT' && (
            <>
              {deliveryNavUrl && (
                <a href={deliveryNavUrl} target="_blank" rel="noopener noreferrer" className="btn-navigate">
                  🧭 Navigate to Beneficiary
                </a>
              )}
              <button
                className="btn-action btn-deliver"
                onClick={() => navigate(`/volunteer/assignments/${id}/delivery`)}
                disabled={actionLoading}
              >
                📋 Confirm Delivery
              </button>
            </>
          )}

          {assignment.status === 'DELIVERED' && (
            <div className="success-message" style={{ width: '100%' }}>
              <div className="success-icon">📬</div>
              <h2>Delivery Complete</h2>
              <p>Waiting for beneficiary acknowledgement to complete this task.</p>
            </div>
          )}

          {assignment.status === 'COMPLETED' && (
            <div className="success-message" style={{ width: '100%' }}>
              <div className="success-icon">🎉</div>
              <h2>Task Completed</h2>
              <p>This delivery has been successfully completed.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AssignmentDetails;
