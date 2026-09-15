import React from 'react';

const TaskHistory = ({ assignments }) => {
  if (!assignments || assignments.length === 0) {
    return (
      <div className="task-history">
        <h2 className="section-header">📜 Task History</h2>
        <div className="empty-state">
          <div className="empty-icon">📭</div>
          <p>No completed tasks yet.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="task-history">
      <h2 className="section-header">📜 Task History</h2>
      <div className="history-list">
        {assignments.map((a) => {
          const shortId = a.id.slice(-4).toUpperCase();
          return (
            <div key={a.id} className="history-item">
              <span className="history-id">#{shortId}</span>
              <span className="history-meals">{a.quantity} meals</span>
              <span className={`history-status ${a.status === 'COMPLETED' ? 'completed' : 'cancelled'}`}>
                {a.status === 'COMPLETED' ? '✅ Completed' : '❌ Cancelled'}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TaskHistory;
