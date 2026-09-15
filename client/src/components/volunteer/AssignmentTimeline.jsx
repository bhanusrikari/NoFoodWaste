import React from 'react';

const TIMELINE_STEPS = [
  { key: 'ASSIGNED', label: 'Assigned' },
  { key: 'VOLUNTEER_ACCEPTED', label: 'Accepted' },
  { key: 'PICKUP_STARTED', label: 'Pickup' },
  { key: 'COLLECTED', label: 'Collected' },
  { key: 'IN_TRANSIT', label: 'In Transit' },
  { key: 'DELIVERED', label: 'Delivered' },
  { key: 'COMPLETED', label: 'Completed' },
];

const AssignmentTimeline = ({ currentStatus }) => {
  const currentIndex = TIMELINE_STEPS.findIndex((s) => s.key === currentStatus);

  return (
    <div className="status-timeline">
      <h3>📊 Status Timeline</h3>
      <div className="timeline-steps">
        {TIMELINE_STEPS.map((step, index) => {
          let stepClass = 'pending';
          if (index < currentIndex) stepClass = 'completed';
          else if (index === currentIndex) stepClass = 'current';

          return (
            <div key={step.key} className={`timeline-step ${stepClass}`}>
              <div className="timeline-dot">
                {stepClass === 'completed' ? '✓' : index + 1}
              </div>
              <span className="timeline-label">{step.label}</span>
              {index < TIMELINE_STEPS.length - 1 && <div className="timeline-connector" />}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AssignmentTimeline;
