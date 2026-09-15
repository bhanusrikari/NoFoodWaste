import React from 'react';

const VolunteerStats = ({ profile }) => {
  const activeCount = profile ? profile.totalTasks - profile.completedTasks : 0;

  return (
    <div className="stats-grid">
      <div className="stat-card">
        <div className="stat-icon active">📋</div>
        <div className="stat-details">
          <h3>{activeCount >= 0 ? activeCount : 0}</h3>
          <p>Active Tasks</p>
        </div>
      </div>
      <div className="stat-card">
        <div className="stat-icon completed">✅</div>
        <div className="stat-details">
          <h3>{profile ? profile.completedTasks : 0}</h3>
          <p>Completed Tasks</p>
        </div>
      </div>
      <div className="stat-card">
        <div className="stat-icon meals">🍽️</div>
        <div className="stat-details">
          <h3>{profile ? profile.totalMealsDelivered : 0}</h3>
          <p>Meals Delivered</p>
        </div>
      </div>
      <div className="stat-card">
        <div className="stat-icon distance">📍</div>
        <div className="stat-details">
          <h3>{profile ? `${profile.totalDistance}` : '0'} km</h3>
          <p>Distance</p>
        </div>
      </div>
    </div>
  );
};

export default VolunteerStats;
