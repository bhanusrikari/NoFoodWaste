import React from 'react';

const stages = [
  { id: 'OPEN', label: 'Request Created', stepIndex: 1 },
  { id: 'MATCHED', label: 'Donor Matched', stepIndex: 2 },
  { id: 'DELIVERY_ASSIGNED', label: 'Delivery Assigned', stepIndex: 3 },
  { id: 'OUT_FOR_DELIVERY', label: 'Out for Delivery', stepIndex: 4 },
  { id: 'DELIVERED', label: 'Delivered', stepIndex: 5 },
  { id: 'ACKNOWLEDGED', label: 'Acknowledged', stepIndex: 6 },
];

const getStatusIndex = (status) => {
  switch (status) {
    case 'OPEN': return 1;
    case 'MATCHED': return 2;
    case 'DELIVERY_ASSIGNED': return 3;
    case 'OUT_FOR_DELIVERY': return 4;
    case 'DELIVERED': return 5;
    case 'ACKNOWLEDGED': return 6;
    default: return 0;
  }
};

const RequestProgressTimeline = ({ status }) => {
  if (status === 'REJECTED' || status === 'CANCELLED') {
    return (
      <div
        style={{
          backgroundColor: '#fef2f2',
          border: '1px solid #fecaca',
          padding: '1.25rem',
          borderRadius: '8px',
          color: '#991b1b',
          fontSize: '0.9rem',
          marginTop: '1.5rem',
          marginBottom: '1.5rem',
        }}
      >
        <strong>Request Status:</strong> This food requirement has been {status.toLowerCase()}. Further fulfillment workflow has been terminated.
      </div>
    );
  }

  const currentStep = getStatusIndex(status);

  return (
    <div style={{ marginTop: '1.5rem', marginBottom: '2rem' }}>
      <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#374151', marginBottom: '1rem' }}>
        Fulfillment Progress
      </h3>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
          gap: '0.75rem',
          position: 'relative',
        }}
      >
        {stages.map((stage) => {
          const isCompleted = currentStep >= stage.stepIndex;
          const isCurrent = currentStep === stage.stepIndex;

          return (
            <div
              key={stage.id}
              style={{
                backgroundColor: isCompleted ? '#ecfdf5' : '#f9fafb',
                border: `1px solid ${isCompleted ? '#a7f3d0' : '#e5e7eb'}`,
                borderRadius: '6px',
                padding: '0.85rem 0.75rem',
                textAlign: 'center',
                transition: 'all 0.2s',
              }}
            >
              <div
                style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  backgroundColor: isCompleted ? '#10b981' : '#d1d5db',
                  color: '#ffffff',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 0.5rem auto',
                }}
              >
                {isCompleted ? '✓' : stage.stepIndex}
              </div>
              <p
                style={{
                  fontSize: '0.8rem',
                  fontWeight: isCurrent ? 700 : isCompleted ? 600 : 500,
                  color: isCompleted ? '#065f46' : '#6b7280',
                  margin: 0,
                  lineHeight: '1.2',
                }}
              >
                {stage.label}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default RequestProgressTimeline;
