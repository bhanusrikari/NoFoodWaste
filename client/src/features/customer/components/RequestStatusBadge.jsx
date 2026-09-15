import React from 'react';

const statusConfig = {
  OPEN: {
    label: 'Open',
    bg: '#ecfdf5',
    color: '#047857',
    border: '#a7f3d0',
  },
  MATCHED: {
    label: 'Donor Matched',
    bg: '#eff6ff',
    color: '#1d4ed8',
    border: '#bfdbfe',
  },
  DELIVERY_ASSIGNED: {
    label: 'Delivery Assigned',
    bg: '#f0f5ff',
    color: '#3730a3',
    border: '#c7d2fe',
  },
  OUT_FOR_DELIVERY: {
    label: 'Out for Delivery',
    bg: '#fffbeb',
    color: '#b45309',
    border: '#fde68a',
  },
  DELIVERED: {
    label: 'Delivered',
    bg: '#f0fdf4',
    color: '#15803d',
    border: '#bbf7d0',
  },
  ACKNOWLEDGED: {
    label: 'Acknowledged',
    bg: '#f0fdfa',
    color: '#0f766e',
    border: '#99f6e4',
  },
  REJECTED: {
    label: 'Rejected',
    bg: '#fef2f2',
    color: '#b91c1c',
    border: '#fecaca',
  },
  CANCELLED: {
    label: 'Cancelled',
    bg: '#f3f4f6',
    color: '#4b5563',
    border: '#e5e7eb',
  },
};

const RequestStatusBadge = ({ status }) => {
  const config = statusConfig[status] || {
    label: status || 'Unknown',
    bg: '#f3f4f6',
    color: '#374151',
    border: '#e5e7eb',
  };

  return (
    <span
      style={{
        backgroundColor: config.bg,
        color: config.color,
        border: `1px solid ${config.border}`,
        fontSize: '0.75rem',
        fontWeight: 700,
        padding: '0.25rem 0.65rem',
        borderRadius: '12px',
        textTransform: 'uppercase',
        letterSpacing: '0.04em',
        display: 'inline-block',
      }}
    >
      {config.label}
    </span>
  );
};

export default RequestStatusBadge;
