import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../features/auth/authContext';
import { createFoodRequest } from '../../features/customer/services/foodRequestService';

const RequestFood = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const [formData, setFormData] = useState({
    customerName: currentUser?.organizationName || currentUser?.name || '',
    phone: currentUser?.phone || '',
    peopleCount: '',
    foodType: 'Veg',
    foodCategory: 'Cooked',
    location: '',
    requiredDate: '',
    requiredTime: '',
    notes: '',
  });

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Frontend Validations
    if (!formData.peopleCount || Number(formData.peopleCount) < 1) {
      setError('People required must be at least 1');
      return;
    }
    if (!formData.foodType) {
      setError('Food type is required');
      return;
    }
    if (!formData.foodCategory) {
      setError('Food category is required');
      return;
    }
    if (!formData.location || formData.location.trim() === '') {
      setError('Location is required');
      return;
    }
    if (!formData.requiredDate) {
      setError('Required date is required');
      return;
    }
    if (!formData.requiredTime) {
      setError('Required time is required');
      return;
    }

    setLoading(true);

    try {
      const payload = {
        customerName: formData.customerName.trim() || currentUser?.name || 'Food Recipient',
        phone: formData.phone.trim() || currentUser?.phone || '+91 98765 43210',
        numberOfMeals: Number(formData.peopleCount),
        peopleCount: Number(formData.peopleCount),
        foodType: formData.foodType,
        foodCategory: formData.foodCategory,
        location: formData.location.trim(),
        requiredDate: formData.requiredDate,
        requiredTime: formData.requiredTime,
        notes: formData.notes ? formData.notes.trim() : '',
      };

      const res = await createFoodRequest(payload);

      if (res.success) {
        setSuccess('Food requirement submitted successfully! Redirecting to My Requests...');
        setTimeout(() => {
          navigate('/customer/requests');
        }, 1200);
      }
    } catch (err) {
      setError(err.message || 'Failed to submit food requirement. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ paddingTop: '2rem', paddingBottom: '2rem' }}>
      <header style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 700, color: '#111827', marginBottom: '0.5rem' }}>
          Request Food Assistance
        </h1>
        <p style={{ color: '#4b5563', fontSize: '1rem' }}>
          Specify your food requirement details to initiate matching with verified donors.
        </p>
      </header>

      <div
        style={{
          backgroundColor: '#ffffff',
          padding: '2.5rem',
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
          border: '1px solid #e5e7eb',
          maxWidth: '680px',
        }}
      >
        {error && <div className="alert alert-danger">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label htmlFor="customerName">Organization / Caretaker Name *</label>
              <input
                type="text"
                id="customerName"
                name="customerName"
                className="form-control"
                placeholder="e.g. ABC Orphanage Caretaker"
                value={formData.customerName}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="phone">Contact Phone Number *</label>
              <input
                type="text"
                id="phone"
                name="phone"
                className="form-control"
                placeholder="e.g. +91 98765 43210"
                value={formData.phone}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label htmlFor="peopleCount">People / Meals Required *</label>
              <input
                type="number"
                id="peopleCount"
                name="peopleCount"
                min="1"
                className="form-control"
                placeholder="e.g. 100"
                value={formData.peopleCount}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="foodType">Food Type *</label>
              <select
                id="foodType"
                name="foodType"
                className="form-control"
                value={formData.foodType}
                onChange={handleChange}
                required
              >
                <option value="Veg">Veg</option>
                <option value="Non-Veg">Non-Veg</option>
                <option value="Both">Both (Veg & Non-Veg)</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="foodCategory">Food Category *</label>
              <select
                id="foodCategory"
                name="foodCategory"
                className="form-control"
                value={formData.foodCategory}
                onChange={handleChange}
                required
              >
                <option value="Cooked">Cooked Meals</option>
                <option value="Raw/Groceries">Raw / Groceries</option>
                <option value="Packaged">Packaged Goods</option>
                <option value="Bakery">Bakery Items</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="location">Delivery Location / Address *</label>
            <input
              type="text"
              id="location"
              name="location"
              className="form-control"
              placeholder="e.g. XYZ, Bhavani Nagar, Hyderabad"
              value={formData.location}
              onChange={handleChange}
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label htmlFor="requiredDate">Required Date *</label>
              <input
                type="date"
                id="requiredDate"
                name="requiredDate"
                className="form-control"
                value={formData.requiredDate}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="requiredTime">Required Time *</label>
              <input
                type="time"
                id="requiredTime"
                name="requiredTime"
                className="form-control"
                value={formData.requiredTime}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="notes">Additional Notes / Instructions (Optional)</label>
            <textarea
              id="notes"
              name="notes"
              rows="3"
              className="form-control"
              placeholder="Specify dietary details, contact instructions, or access constraints..."
              value={formData.notes}
              onChange={handleChange}
            />
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading} style={{ marginTop: '0.5rem' }}>
            {loading ? 'Submitting Request...' : 'Request Food Assistance'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default RequestFood;
