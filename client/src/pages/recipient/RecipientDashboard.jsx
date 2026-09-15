import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../features/auth/authContext';
import { foodRequirementService } from '../../services/foodRequirementService';
import { fulfillmentService } from '../../services/fulfillmentService';

const RecipientDashboard = () => {
  const { currentUser } = useAuth();
  const [requirements, setRequirements] = useState([]);
  const [fulfillments, setFulfillments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Acknowledge Modal
  const [ackItem, setAckItem] = useState(null);
  const [ackNote, setAckNote] = useState('Food received in good condition. Thank you!');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchRecipientData();
  }, []);

  const fetchRecipientData = async () => {
    try {
      setLoading(true);
      const [reqData, fulData] = await Promise.all([
        foodRequirementService.getMy(),
        fulfillmentService.getRecipientMy(),
      ]);

      if (reqData.success) setRequirements(reqData.requirements || []);
      if (fulData.success) setFulfillments(fulData.fulfillments || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch recipient data');
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptOffer = async (id) => {
    try {
      const res = await fulfillmentService.acceptBeneficiary(id);
      if (res.success) {
        alert('Donation offer accepted! Delivery arrangement initiated.');
        fetchRecipientData();
      }
    } catch (err) {
      alert(err.message || 'Failed to accept offer');
    }
  };

  const handleRejectOffer = async (id) => {
    const reason = prompt('Please enter reason for declining (e.g. Storage capacity full):', 'Storage capacity full');
    if (reason === null) return;

    try {
      const res = await fulfillmentService.rejectBeneficiary(id, { reason });
      if (res.success) {
        alert('Donation offer declined.');
        fetchRecipientData();
      }
    } catch (err) {
      alert(err.message || 'Failed to decline offer');
    }
  };

  const handleAcknowledge = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const res = await fulfillmentService.acknowledge(ackItem.id, {
        note: ackNote,
        receivedQuantity: ackItem.foodSummary?.quantity,
      });

      if (res.success) {
        alert('Receipt acknowledged successfully! Thank you!');
        setAckItem(null);
        fetchRecipientData();
      }
    } catch (err) {
      alert(err.message || 'Failed to acknowledge receipt');
    } finally {
      setSubmitting(false);
    }
  };

  const pendingOffers = fulfillments.filter(f => f.status === 'BENEFICIARY_PENDING');
  const activeFulfillments = fulfillments.filter(f => f.status !== 'BENEFICIARY_PENDING');

  return (
    <div className="container">
      <div className="dashboard-header">
        <h1>Welcome, {currentUser?.name || 'Food Recipient'} 👋</h1>
        <p>Post food needs and manage incoming food donations for your community.</p>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {/* Incoming Donor Offers Requiring Acceptance */}
      {pendingOffers.length > 0 && (
        <div className="card-table" style={{ borderLeft: '4px solid #3b82f6', background: '#eff6ff', marginBottom: '2rem' }}>
          <h3 style={{ color: '#1e40af' }}>🔔 Incoming Food Donation Offers ({pendingOffers.length})</h3>
          <p style={{ color: '#3b82f6', fontSize: '0.9rem', marginBottom: '1rem' }}>
            Donors have selected your organization for a food donation. Please review and accept or decline.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
            {pendingOffers.map((item) => (
              <div key={item.id} style={{ background: 'white', padding: '1rem', borderRadius: '8px', border: '1px solid #bfdbfe' }}>
                <div style={{ fontWeight: 700, color: '#111827' }}>Offer ID: {item.fulfillmentId}</div>
                <div style={{ fontSize: '0.85rem', color: '#4b5563', margin: '0.5rem 0' }}>
                  <div><strong>Donor:</strong> {item.donor?.name || 'Anonymous Donor'}</div>
                  <div><strong>Food:</strong> {item.foodSummary?.quantity} {item.foodSummary?.unit} ({item.foodSummary?.foodType})</div>
                  <div><strong>Items:</strong> {item.foodSummary?.foodItems}</div>
                  <div><strong>Delivery:</strong> {item.deliveryMethod === 'DIRECT' ? '🚲 Direct Delivery' : '🚗 Volunteer assistance'}</div>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
                  <button onClick={() => handleAcceptOffer(item.id)} className="btn btn-primary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}>
                    ✓ Accept Donation
                  </button>
                  <button onClick={() => handleRejectOffer(item.id)} className="btn btn-danger" style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}>
                    ✕ Decline
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Action Banner */}
      <div className="actions-banner" style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)' }}>
        <h2>Need Food Support for Your Community?</h2>
        <p>Post your requirement so local donors and hotels can fulfill meals for your organization.</p>
        <Link to="/recipient/create-requirement" className="btn" style={{ color: '#4f46e5' }}>
          + Post New Food Requirement
        </Link>
      </div>

      {/* Active Fulfillments / Incoming Deliveries */}
      <div className="card-table">
        <h3>Incoming Deliveries & Active Fulfillments</h3>
        {loading ? (
          <p style={{ textAlign: 'center', padding: '1.5rem', color: '#6b7280' }}>Loading incoming deliveries...</p>
        ) : activeFulfillments.length === 0 ? (
          <p style={{ color: '#6b7280', padding: '1rem 0' }}>No active food deliveries at the moment.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Donor</th>
                <th>Food & Quantity</th>
                <th>Delivery Method</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {activeFulfillments.map((item) => (
                <tr key={item.id}>
                  <td><strong>{item.fulfillmentId}</strong></td>
                  <td>{item.donor?.name || 'Anonymous Donor'}</td>
                  <td>
                    {item.foodSummary?.foodType} ({item.foodSummary?.quantity} {item.foodSummary?.unit})
                    <div style={{ fontSize: '0.78rem', color: '#6b7280' }}>{item.foodSummary?.foodItems}</div>
                  </td>
                  <td>
                    <span className={`delivery-badge delivery-${item.deliveryMethod}`}>
                      {item.deliveryMethod === 'DIRECT' ? '🚲 Direct Delivery' : '🚗 Volunteer Assistance'}
                    </span>
                  </td>
                  <td>
                    <span className={`status-badge status-${item.status}`}>
                      {item.status.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td>
                    {item.acknowledgement?.isAcknowledged ? (
                      <span className="status-badge status-COMPLETED">✓ Acknowledged</span>
                    ) : item.status === 'BENEFICIARY_REJECTED' ? (
                      <span className="status-badge status-CANCELLED">Declined</span>
                    ) : (
                      <button
                        onClick={() => setAckItem(item)}
                        className="btn btn-primary"
                        style={{ padding: '0.35rem 0.7rem', fontSize: '0.8rem' }}
                      >
                        Acknowledge Receipt
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* My Food Requirements List */}
      <div className="card-table">
        <h3>My Posted Food Requirements</h3>
        {requirements.length === 0 ? (
          <p style={{ color: '#6b7280', padding: '1rem 0' }}>No requirements posted yet.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Organization</th>
                <th>Location</th>
                <th>Meals Needed</th>
                <th>Cuisine</th>
                <th>Date & Time</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {requirements.map((req) => (
                <tr key={req.id}>
                  <td><strong>{req.organizationName}</strong></td>
                  <td>{req.location}</td>
                  <td><span style={{ color: '#10b981', fontWeight: 700 }}>{req.peopleCount} meals</span></td>
                  <td>{req.cuisine}</td>
                  <td>{new Date(req.requiredDate).toLocaleDateString()} at {req.requiredTime}</td>
                  <td>
                    <span className={`status-badge status-${req.status}`}>{req.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Acknowledge Modal */}
      {ackItem && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Acknowledge Receipt of Food</h3>
              <button className="close-btn" onClick={() => setAckItem(null)}>×</button>
            </div>

            <form onSubmit={handleAcknowledge}>
              <div className="alert alert-info">
                Fulfillment: <strong>{ackItem.fulfillmentId}</strong><br />
                Donor: {ackItem.donor?.name || 'Donor'}<br />
                Food: {ackItem.foodSummary?.quantity} {ackItem.foodSummary?.unit} ({ackItem.foodSummary?.foodType})
              </div>

              <div className="form-group">
                <label>Acknowledgement Note / Feedback</label>
                <textarea
                  className="form-control"
                  rows="3"
                  value={ackNote}
                  onChange={(e) => setAckNote(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setAckItem(null)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Confirming...' : 'Confirm Receipt & Complete'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default RecipientDashboard;
