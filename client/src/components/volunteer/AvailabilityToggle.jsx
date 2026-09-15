import React from 'react';

const AvailabilityToggle = ({ availability, onSetAvailable, onSetUnavailable, loading }) => {
  const getIndicatorClass = () => {
    switch (availability) {
      case 'AVAILABLE': return 'available';
      case 'BUSY': return 'busy';
      case 'UNAVAILABLE': return 'unavailable';
      default: return 'unavailable';
    }
  };

  const getIndicatorIcon = () => {
    switch (availability) {
      case 'AVAILABLE': return '🟢';
      case 'BUSY': return '🟠';
      case 'UNAVAILABLE': return '⚪';
      default: return '⚪';
    }
  };

  return (
    <div className="availability-toggle">
      <span className={`availability-indicator ${getIndicatorClass()}`}>
        {getIndicatorIcon()} {availability}
      </span>
      {availability !== 'AVAILABLE' && availability !== 'BUSY' && (
        <button
          className="availability-btn set-available"
          onClick={onSetAvailable}
          disabled={loading}
        >
          Set Available
        </button>
      )}
      {availability === 'AVAILABLE' && (
        <button
          className="availability-btn set-unavailable"
          onClick={onSetUnavailable}
          disabled={loading}
        >
          Set Unavailable
        </button>
      )}
    </div>
  );
};

export default AvailabilityToggle;
