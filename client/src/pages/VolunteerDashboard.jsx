import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../features/auth/authContext';
import volunteerService from '../features/volunteer/volunteerService';
import AvailabilityToggle from '../components/volunteer/AvailabilityToggle';
import VolunteerStats from '../components/volunteer/VolunteerStats';
import AssignmentCard from '../components/volunteer/AssignmentCard';
import TaskHistory from '../components/volunteer/TaskHistory';
import '../features/volunteer/volunteer.css';

const VolunteerDashboard = () => {
  const { currentUser } = useAuth();

  const [profile, setProfile] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const [error, setError] = useState('');

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const [profileRes, assignmentsRes, historyRes] = await Promise.all([
        volunteerService.getProfile(),
        volunteerService.getMyAssignments(),
        volunteerService.getMyHistory(),
      ]);

      setProfile(profileRes.volunteer);

      // Filter to show only active assignments
      const activeStatuses = [
        'ASSIGNED', 'VOLUNTEER_ACCEPTED', 'PICKUP_STARTED',
        'COLLECTED', 'IN_TRANSIT', 'DELIVERED',
      ];
      const activeAssignments = (assignmentsRes.assignments || []).filter(
        (a) => activeStatuses.includes(a.status)
      );
      setAssignments(activeAssignments);
      setHistory(historyRes.assignments || []);
    } catch (err) {
      setError(err.message || 'Unable to load your dashboard.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSetAvailable = async () => {
    try {
      setAvailabilityLoading(true);
      const res = await volunteerService.updateAvailability('AVAILABLE');
      setProfile(res.volunteer);
    } catch (err) {
      setError(err.message);
    } finally {
      setAvailabilityLoading(false);
    }
  };

  const handleSetUnavailable = async () => {
    try {
      setAvailabilityLoading(true);
      const res = await volunteerService.updateAvailability('UNAVAILABLE');
      setProfile(res.volunteer);
    } catch (err) {
      setError(err.message);
    } finally {
      setAvailabilityLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="volunteer-dashboard">
        <div className="loading-state">
          <span className="loading-spinner"></span>
          Loading your assignments...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="volunteer-dashboard">
        <div className="error-state">
          <p>⚠️ {error}</p>
          <button className="btn-view" onClick={loadData} style={{ marginTop: '1rem' }}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="volunteer-dashboard">
      {/* Header */}
      <div className="volunteer-header">
        <div>
          <h1>🚚 Volunteer Dashboard</h1>
          <p style={{ color: '#6b7280', margin: '0.25rem 0 0', fontSize: '0.9rem' }}>
            Welcome back, <strong>{currentUser?.name}</strong>
          </p>
        </div>
        <div className="volunteer-header-actions">
          <AvailabilityToggle
            availability={profile?.availability || 'UNAVAILABLE'}
            onSetAvailable={handleSetAvailable}
            onSetUnavailable={handleSetUnavailable}
            loading={availabilityLoading}
          />
        </div>
      </div>

      {/* Stats */}
      <VolunteerStats profile={profile} />

      {/* My Assigned Tasks */}
      <h2 className="section-header">📋 My Assigned Tasks</h2>
      {assignments.length > 0 ? (
        <div className="assignments-list">
          {assignments.map((assignment) => (
            <AssignmentCard key={assignment.id} assignment={assignment} />
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <div className="empty-icon">📭</div>
          <p>No assignments have been assigned to you.</p>
        </div>
      )}

      {/* Task History */}
      <TaskHistory assignments={history} />
    </div>
  );
};

export default VolunteerDashboard;
