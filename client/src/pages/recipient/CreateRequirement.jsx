import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { foodRequirementService } from '../../services/foodRequirementService';

const CreateRequirement = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    organizationName: 'Sunshine Children\'s Home',
    location: '124 Hope Avenue, West Ward',
    peopleCount: 80,
    foodType: 'Cooked Meal',
    cuisine: 'South Indian',
    requiredDate: new Date().toISOString().slice(0, 10),
    requiredTime: '19:00',
    notes: 'Require meals for dinner. Thermal containers preferred.',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      setLoading(true);
      const res = await foodRequirementService.create(formData);
      if (res.success) {
        alert('Food requirement posted successfully! Local donors will be notified.');
        navigate('/recipient');
      }
    } catch (err) {
      setError(err.message || 'Failed to post food requirement');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ maxWidth: '650px' }}>
      <div className="dashboard-header">
        <h1>Post a Food Requirement</h1>
        <p>Let local donors and hotels know about your food demand.</p>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      <div className="auth-card" style={{ maxWidth: '100%' }}>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Organization / Shelter Name *</label>
            <input
              type="text"
              name="organizationName"
              className="form-control"
              placeholder="e.g. Hope Shelter, City Care Center"
              value={formData.organizationName}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Location / Delivery Address *</label>
            <input
              type="text"
              name="location"
              className="form-control"
              placeholder="Street name, landmark, area"
              value={formData.location}
              onChange={handleChange}
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label>Number of Meals / People *</label>
              <input
                type="number"
                name="peopleCount"
                className="form-control"
                min="1"
                value={formData.peopleCount}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Food Type *</label>
              <select
                name="foodType"
                className="form-control"
                value={formData.foodType}
                onChange={handleChange}
                required
              >
                <option value="Cooked Meal">Cooked Meal</option>
                <option value="Raw Food">Raw Food</option>
                <option value="Packaged Food">Packaged Food</option>
                <option value="Bakery">Bakery</option>
                <option value="Fruits & Vegetables">Fruits & Vegetables</option>
                <option value="Beverages">Beverages</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label>Cuisine Preference</label>
              <input
                type="text"
                name="cuisine"
                className="form-control"
                placeholder="South Indian, North Indian, Any..."
                value={formData.cuisine}
                onChange={handleChange}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
              <div className="form-group">
                <label>Date *</label>
                <input
                  type="date"
                  name="requiredDate"
                  className="form-control"
                  value={formData.requiredDate}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Time *</label>
                <input
                  type="time"
                  name="requiredTime"
                  className="form-control"
                  value={formData.requiredTime}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
          </div>

          <div className="form-group">
            <label>Additional Notes / Instructions</label>
            <textarea
              name="notes"
              className="form-control"
              rows="3"
              placeholder="e.g. Dietary preferences, packaging instructions"
              value={formData.notes}
              onChange={handleChange}
            />
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Posting...' : 'Post Food Requirement →'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreateRequirement;
