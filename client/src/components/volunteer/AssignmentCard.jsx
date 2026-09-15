import React from 'react';
import { useNavigate } from 'react-router-dom';

const statusClassMap = {
  ASSIGNED: 'assigned',
  VOLUNTEER_ACCEPTED: 'accepted',
  PICKUP_STARTED: 'pickup',
  COLLECTED: 'collected',
  IN_TRANSIT: 'transit',
  DELIVERED: 'delivered',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
};

const statusLabelMap = {
  ASSIGNED: 'Assigned',
  VOLUNTEER_ACCEPTED: 'Accepted',
  PICKUP_STARTED: 'Pickup Started',
  COLLECTED: 'Collected',
  IN_TRANSIT: 'In Transit',
  DELIVERED: 'Delivered',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
};

const AssignmentCard = ({ assignment }) => {
  const navigate = useNavigate();
  const shortId = assignment.id.slice(-4).toUpperCase();
  const statusClass = statusClassMap[assignment.status] || 'assigned';

  const pickupName = assignment.donorId?.name || 'Unknown Donor';
  const deliveryName = assignment.beneficiaryId?.name || 'Unknown Beneficiary';
  const vehicleNum = assignment.vehicleId?.vehicleNumber || 'N/A';

  return (
    <div className={`assignment-card status-${statusClass}`}>
      <div className="assignment-card-header">
        <span className="assignment-card-id">Delivery #{shortId}</span>
        <span className={`status-badge ${statusClass}`}>
          {statusLabelMap[assignment.status]}
        </span>
      </div>

      <div className="assignment-card-info">
        <div className="info-item">
          <span className="info-icon">📦</span>
          <div>
            <div className="info-label">Pickup</div>
            <div className="info-value">{pickupName}</div>
          </div>
        </div>
        <div className="info-item">
          <span className="info-icon">📍</span>
          <div>
            <div className="info-label">Delivery</div>
            <div className="info-value">{deliveryName}</div>
          </div>
        </div>
        <div className="info-item">
          <span className="info-icon">🍽️</span>
          <div>
            <div className="info-label">Food</div>
            <div className="info-value">
              {typeof assignment.quantity === 'object'
                ? `${assignment.quantity.value} ${assignment.quantity.unit}`
                : `${assignment.quantity} meals`}
            </div>
          </div>
        </div>
        <div className="info-item">
          <span className="info-icon">🚚</span>
          <div>
            <div className="info-label">Vehicle</div>
            <div className="info-value">{vehicleNum}</div>
          </div>
        </div>
      </div>

      <div className="assignment-card-actions">
        <button
          className="btn-view"
          onClick={() => navigate(`/volunteer/assignments/${assignment.id}`)}
        >
          View Task →
        </button>
      </div>
    </div>
  );
};

export default AssignmentCard;
