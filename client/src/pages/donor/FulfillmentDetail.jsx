import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { fulfillmentService } from '../../services/fulfillmentService';

const FulfillmentDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    fetchDetail();
  }, [id]);

  const fetchDetail = async () => {
    try {
      setLoading(true);
      const data = await fulfillmentService.getById(id);
      setItem(data.fulfillment);
    } catch (err) {
      setError(err.message || 'Failed to fetch fulfillment detail');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!window.confirm('Are you sure you want to cancel this fulfillment?')) {
      return;
    }

    try {
      setCancelling(true);
      const res = await fulfillmentService.cancel(id);
      if (res.success) {
        alert('Fulfillment cancelled');
        fetchDetail();
      }
    } catch (err) {
      alert(err.message || 'Failed to cancel');
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return <div className="container" style={{ textAlign: 'center', padding: '3rem' }}>Loading details...</div>;
  }

  if (error || !item) {
    return (
      <div className="container">
        <div className="alert alert-danger">{error || 'Fulfillment not found'}</div>
        <Link to="/donor/fulfillments" className="btn btn-secondary">← Back to My Fulfillments</Link>
      </div>
    );
  }

  // Dynamic steps based on delivery method & offer flow
  const steps = [];
  if (item.status === 'BENEFICIARY_PENDING' || item.status === 'BENEFICIARY_ACCEPTED' || item.status === 'BENEFICIARY_REJECTED') {
    steps.push({ key: 'BENEFICIARY_PENDING', label: 'Beneficiary Pending' });
    steps.push({ key: 'BENEFICIARY_ACCEPTED', label: 'Beneficiary Accepted' });
  } else {
    steps.push({ key: 'MATCHED', label: 'Matched' });
  }

  steps.push({ key: 'DELIVERY_METHOD_SELECTED', label: 'Delivery Choice' });

  if (item.deliveryMethod === 'VOLUNTEER_REQUIRED') {
    steps.push({ key: 'VOLUNTEER_ASSIGNED', label: 'Volunteer Assigned' });
    steps.push({ key: 'COLLECTED', label: 'Collected' });
    steps.push({ key: 'SAFETY_VERIFIED', label: 'Safety Verified' });
  }

  steps.push({ key: 'IN_TRANSIT', label: 'In Transit' });
  steps.push({ key: 'DELIVERED', label: 'Delivered' });
  steps.push({ key: 'COMPLETED', label: 'Completed' });

  const getStepStatusClass = (stepKey) => {
    const statusOrder = [
      'BENEFICIARY_PENDING',
      'BENEFICIARY_ACCEPTED',
      'MATCHED',
      'DELIVERY_METHOD_SELECTED',
      'VOLUNTEER_REQUESTED',
      'VOLUNTEER_ASSIGNED',
      'PICKUP_IN_PROGRESS',
      'COLLECTED',
      'SAFETY_VERIFICATION',
      'SAFETY_APPROVED',
      'SAFETY_VERIFIED',
      'IN_TRANSIT',
      'DELIVERED',
      'ACKNOWLEDGED',
      'COMPLETED',
    ];
    const currentIndex = statusOrder.indexOf(item.status);
    const stepIndex = statusOrder.indexOf(stepKey);

    if (['CANCELLED', 'BENEFICIARY_REJECTED', 'SAFETY_REJECTED'].includes(item.status)) return '';
    if (stepIndex < currentIndex) return 'completed';
    if (stepIndex === currentIndex) return 'current';
    return '';
  };

  return (
    <div className="container" style={{ maxWidth: '900px' }}>
      <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Link to="/donor/fulfillments" style={{ fontWeight: 600 }}>← Back to My Fulfillments</Link>
        <span className={`status-badge status-${item.status}`} style={{ fontSize: '0.9rem', padding: '0.4rem 0.9rem' }}>
          {item.status.replace(/_/g, ' ')}
        </span>
      </div>

      <div className="dashboard-header" style={{ marginBottom: '1rem' }}>
        <h1>Fulfillment: {item.fulfillmentId}</h1>
        <p>Created on {new Date(item.createdAt).toLocaleString()}</p>
      </div>

      {/* Visual Timeline */}
      <div className="card-table">
        <h3>Fulfillment Timeline</h3>
        <div className="timeline-container">
          {steps.map((s, idx) => {
            const statusClass = getStepStatusClass(s.key);
            return (
              <div key={s.key} className={`timeline-step ${statusClass}`}>
                <div className="timeline-icon">
                  {statusClass === 'completed' ? '✓' : idx + 1}
                </div>
                <div className="timeline-label">{s.label}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Details Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        {/* Food Info */}
        <div className="card-table" style={{ margin: 0 }}>
          <h3>🍲 Food Details</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.95rem' }}>
            <div><strong>Food Type:</strong> {item.foodSummary?.foodType}</div>
            <div><strong>Cuisine:</strong> {item.foodSummary?.cuisine}</div>
            <div><strong>Quantity:</strong> <span style={{ color: '#10b981', fontWeight: 700 }}>{item.foodSummary?.quantity} {item.foodSummary?.unit}</span></div>
            <div><strong>Food Items:</strong> {item.foodSummary?.foodItems}</div>
            {item.foodSummary?.expiry && (
              <div><strong>Best Before:</strong> {new Date(item.foodSummary.expiry).toLocaleString()}</div>
            )}
            <div><strong>Pickup Address:</strong> {item.pickupAddress}</div>
            <div><strong>Pickup Window:</strong> {item.pickupWindow}</div>
          </div>
        </div>

        {/* Recipient & Delivery Info */}
        <div className="card-table" style={{ margin: 0 }}>
          <h3>📍 Recipient & Delivery</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.95rem' }}>
            <div><strong>Recipient:</strong> {item.recipientName}</div>
            <div><strong>Location:</strong> {item.recipientLocation}</div>
            <div>
              <strong>Delivery Method:</strong>{' '}
              <span className={`delivery-badge delivery-${item.deliveryMethod}`}>
                {item.deliveryMethod === 'DIRECT' ? '🚲 Direct Delivery' : '🚗 Volunteer Assistance'}
              </span>
            </div>

            {item.volunteer ? (
              <div style={{ marginTop: '0.5rem', background: '#f3f4f6', padding: '0.75rem', borderRadius: '6px' }}>
                <div><strong>Assigned Volunteer:</strong> {item.volunteer.name}</div>
                <div><strong>Phone:</strong> {item.volunteer.phone || 'Provided upon pickup'}</div>
                {item.vehicleInfo && <div><strong>Vehicle:</strong> {item.vehicleInfo}</div>}
              </div>
            ) : item.deliveryMethod === 'VOLUNTEER_REQUIRED' ? (
              <div style={{ marginTop: '0.5rem', background: '#fff7ed', padding: '0.75rem', borderRadius: '6px', color: '#c2410c' }}>
                ⏳ Awaiting NGO Admin to assign an available volunteer & vehicle.
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {/* Food Safety Verification Section */}
      {item.safetyVerification?.isVerified && (
        <div className="card-table" style={{ marginTop: '1.5rem', background: item.safetyVerification.result === 'APPROVED' ? '#ecfdf5' : '#fef2f2' }}>
          <h3>🔍 Food Safety Verification</h3>
          <div style={{ fontSize: '0.9rem', color: '#374151', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginTop: '0.5rem' }}>
            <div><strong>Result:</strong> <span style={{ fontWeight: 700, color: item.safetyVerification.result === 'APPROVED' ? '#059669' : '#dc2626' }}>{item.safetyVerification.result}</span></div>
            <div><strong>Hygiene Check:</strong> {item.safetyVerification.hygieneCheck}</div>
            <div><strong>Freshness Check:</strong> {item.safetyVerification.freshnessCheck}</div>
            <div><strong>Packaging Condition:</strong> {item.safetyVerification.packagingCondition}</div>
            <div><strong>Temperature:</strong> {item.safetyVerification.temperatureCheck}</div>
            <div><strong>Verified At:</strong> {new Date(item.safetyVerification.verifiedAt).toLocaleString()}</div>
          </div>
        </div>
      )}

      {/* Acknowledgement Status */}
      <div className="card-table" style={{ marginTop: '1.5rem', background: item.acknowledgement?.isAcknowledged ? '#ecfdf5' : '#ffffff' }}>
        <h3>❤️ Receipt Acknowledgement</h3>
        {item.acknowledgement?.isAcknowledged ? (
          <div>
            <div className="alert alert-success" style={{ margin: '0.5rem 0' }}>
              <strong>Confirmed by {item.acknowledgement.acknowledgedBy}</strong> on {new Date(item.acknowledgement.acknowledgedAt).toLocaleString()}
            </div>
            <p><strong>Quantity Received:</strong> {item.acknowledgement.receivedQuantity} meals</p>
            <p><strong>Note:</strong> "{item.acknowledgement.note}"</p>
          </div>
        ) : (
          <p style={{ color: '#6b7280', marginTop: '0.4rem' }}>
            Receipt acknowledgement will be recorded once food is delivered to the recipient.
          </p>
        )}
      </div>

      {/* Actions */}
      {!['DELIVERED', 'ACKNOWLEDGED', 'COMPLETED', 'CANCELLED', 'BENEFICIARY_REJECTED'].includes(item.status) && (
        <div style={{ marginTop: '1.5rem', textAlign: 'right' }}>
          <button onClick={handleCancel} className="btn btn-danger" disabled={cancelling}>
            {cancelling ? 'Cancelling...' : 'Cancel Fulfillment'}
          </button>
        </div>
      )}
    </div>
  );
};

export default FulfillmentDetail;
