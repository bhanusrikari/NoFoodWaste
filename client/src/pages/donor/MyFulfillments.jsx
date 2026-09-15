import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { fulfillmentService } from '../../services/fulfillmentService';

const MyFulfillments = () => {
  const [fulfillments, setFulfillments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('NEWEST');

  useEffect(() => {
    fetchFulfillments();
  }, []);

  const fetchFulfillments = async () => {
    try {
      setLoading(true);
      const data = await fulfillmentService.getMy();
      setFulfillments(data.fulfillments || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch fulfillments');
    } finally {
      setLoading(false);
    }
  };

  const filtered = fulfillments
    .filter((item) => {
      const search = searchTerm.toLowerCase();
      const matchesSearch =
        item.fulfillmentId.toLowerCase().includes(search) ||
        item.recipientName.toLowerCase().includes(search) ||
        (item.foodSummary?.foodItems || '').toLowerCase().includes(search);
      const matchesStatus = statusFilter === 'ALL' || item.status === statusFilter;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      if (sortBy === 'NEWEST') return new Date(b.createdAt) - new Date(a.createdAt);
      if (sortBy === 'OLDEST') return new Date(a.createdAt) - new Date(b.createdAt);
      if (sortBy === 'EXPIRING') return new Date(a.foodSummary?.expiry || 0) - new Date(b.foodSummary?.expiry || 0);
      return 0;
    });

  return (
    <div className="container">
      <div className="dashboard-header">
        <h1>My Donations & Fulfillments</h1>
        <p>Track all active and past food redistribution activities.</p>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {/* Filter & Sort Bar */}
      <div className="filter-bar">
        <input
          type="text"
          placeholder="🔍 Search by Fulfillment ID, Recipient, Food item..."
          className="form-control search-input"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />

        <select
          className="form-control filter-select"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="ALL">All Statuses</option>
          <option value="MATCHED">Matched</option>
          <option value="VOLUNTEER_REQUESTED">Volunteer Requested</option>
          <option value="VOLUNTEER_ASSIGNED">Volunteer Assigned</option>
          <option value="COLLECTED">Collected</option>
          <option value="DELIVERED">Delivered</option>
          <option value="COMPLETED">Completed</option>
          <option value="CANCELLED">Cancelled</option>
        </select>

        <select
          className="form-control filter-select"
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
        >
          <option value="NEWEST">Sort: Newest First</option>
          <option value="OLDEST">Sort: Oldest First</option>
          <option value="EXPIRING">Sort: Expiring Soon</option>
        </select>
      </div>

      {/* Table */}
      <div className="card-table">
        {loading ? (
          <p style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>Loading your fulfillments...</p>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#6b7280' }}>
            <p>No fulfillments found matching your criteria.</p>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Fulfillment ID</th>
                <th>Food & Quantity</th>
                <th>Recipient / Beneficiary</th>
                <th>Delivery Method</th>
                <th>Status</th>
                <th>Date</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => (
                <tr key={item.id}>
                  <td><strong>{item.fulfillmentId}</strong></td>
                  <td>
                    <strong>{item.foodSummary?.foodType}</strong> ({item.foodSummary?.quantity} {item.foodSummary?.unit})
                    <div style={{ fontSize: '0.78rem', color: '#6b7280' }}>{item.foodSummary?.foodItems}</div>
                  </td>
                  <td>
                    <strong>{item.recipientName}</strong>
                    <div style={{ fontSize: '0.78rem', color: '#6b7280' }}>📍 {item.recipientLocation}</div>
                  </td>
                  <td>
                    <span className={`delivery-badge delivery-${item.deliveryMethod}`}>
                      {item.deliveryMethod === 'DIRECT' ? '🚲 Direct Delivery' : '🚗 Volunteer assistance'}
                    </span>
                  </td>
                  <td>
                    <span className={`status-badge status-${item.status}`}>
                      {item.status.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td style={{ fontSize: '0.85rem', color: '#6b7280' }}>
                    {new Date(item.createdAt).toLocaleDateString()}
                  </td>
                  <td>
                    <Link to={`/donor/fulfillments/${item.id}`} className="btn btn-outline" style={{ padding: '0.35rem 0.7rem', fontSize: '0.8rem' }}>
                      Details
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default MyFulfillments;
