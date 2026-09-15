import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { foodRequirementService } from '../../services/foodRequirementService';
import { fulfillmentService } from '../../services/fulfillmentService';

const AvailableRequirements = () => {
  const navigate = useNavigate();
  const [requirements, setRequirements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [cuisineFilter, setCuisineFilter] = useState('ALL');

  // Modal State
  const [selectedReq, setSelectedReq] = useState(null);
  const [deliveryMethod, setDeliveryMethod] = useState('DIRECT');
  const [foodDetails, setFoodDetails] = useState({
    foodItems: 'Freshly Prepared Meals',
    pickupAddress: '',
    availableFrom: '09:00',
    availableUntil: '21:00',
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchOpenRequirements();
  }, []);

  const fetchOpenRequirements = async () => {
    try {
      setLoading(true);
      const data = await foodRequirementService.getOpen();
      setRequirements(data.requirements || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch open requirements');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenFulfillModal = (req) => {
    setSelectedReq(req);
    setFoodDetails({
      foodItems: `${req.foodType || 'Cooked Meals'} for ${req.peopleCount} people`,
      pickupAddress: '',
      availableFrom: '09:00',
      availableUntil: '21:00',
    });
  };

  const handleFulfillSubmit = async (e) => {
    e.preventDefault();
    if (!foodDetails.pickupAddress) {
      alert('Please enter your pickup address');
      return;
    }

    try {
      setSubmitting(true);
      const res = await fulfillmentService.fulfillRequirement({
        requirementId: selectedReq.id,
        deliveryMethod,
        foodDetails: {
          ...foodDetails,
          foodType: selectedReq.foodType,
          cuisine: selectedReq.cuisine,
          quantity: selectedReq.peopleCount,
        },
      });

      if (res.success) {
        alert('Requirement fulfillment initiated successfully!');
        setSelectedReq(null);
        navigate(`/donor/fulfillments/${res.fulfillment.id}`);
      }
    } catch (err) {
      alert(err.message || 'Failed to fulfill requirement');
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = requirements.filter((r) => {
    const matchesSearch =
      r.organizationName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.foodType.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCuisine = cuisineFilter === 'ALL' || r.cuisine === cuisineFilter;
    return matchesSearch && matchesCuisine;
  });

  return (
    <div className="container">
      <div className="dashboard-header">
        <h1>Open Food Requirements</h1>
        <p>Review active food requests posted by verified beneficiaries and shelters.</p>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {/* Filter Bar */}
      <div className="filter-bar">
        <input
          type="text"
          placeholder="🔍 Search by organization, location, food type..."
          className="form-control search-input"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <select
          className="form-control filter-select"
          value={cuisineFilter}
          onChange={(e) => setCuisineFilter(e.target.value)}
        >
          <option value="ALL">All Cuisines</option>
          <option value="South Indian">South Indian</option>
          <option value="North Indian">North Indian</option>
          <option value="Bakery">Bakery</option>
          <option value="Mixed">Mixed</option>
          <option value="Any">Any Cuisine</option>
        </select>
      </div>

      {/* Grid of Requirements */}
      {loading ? (
        <p style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>Loading open requests...</p>
      ) : filtered.length === 0 ? (
        <div className="card-table" style={{ textAlign: 'center', padding: '3rem' }}>
          <h3>No matching food requirements found</h3>
          <p style={{ color: '#6b7280', margin: '0.5rem 0 1.5rem' }}>
            There are currently no open food requests matching your criteria. You can create a standalone food donation instead!
          </p>
          <button onClick={() => navigate('/donor/donate')} className="btn btn-primary">
            Donate Food to Someone in Need →
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
          {filtered.map((req) => (
            <div key={req.id} className="card-table" style={{ margin: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                  <h3 style={{ fontSize: '1.2rem', margin: 0 }}>{req.organizationName}</h3>
                  <span className="status-badge status-OPEN">OPEN</span>
                </div>

                <div style={{ fontSize: '0.9rem', color: '#4b5563', marginBottom: '1rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  <div>📍 <strong>Location:</strong> {req.location}</div>
                  <div>👥 <strong>People Needed:</strong> <span style={{ color: '#10b981', fontWeight: 700 }}>{req.peopleCount} meals</span></div>
                  <div>🍲 <strong>Food Type:</strong> {req.foodType} ({req.cuisine})</div>
                  <div>📅 <strong>Required Date/Time:</strong> {new Date(req.requiredDate).toLocaleDateString()} at {req.requiredTime}</div>
                  {req.notes && <div>📝 <strong>Notes:</strong> {req.notes}</div>}
                </div>
              </div>

              <button onClick={() => handleOpenFulfillModal(req)} className="btn btn-primary">
                I Can Fulfill This Request →
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Fulfillment Modal */}
      {selectedReq && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Fulfill Request: {selectedReq.organizationName}</h3>
              <button className="close-btn" onClick={() => setSelectedReq(null)}>×</button>
            </div>

            <form onSubmit={handleFulfillSubmit}>
              <div className="alert alert-info">
                Fulfilling <strong>{selectedReq.peopleCount} meals</strong> for {selectedReq.organizationName} ({selectedReq.location}).
              </div>

              <div className="form-group">
                <label>Food Description / Items</label>
                <input
                  type="text"
                  className="form-control"
                  value={foodDetails.foodItems}
                  onChange={(e) => setFoodDetails({ ...foodDetails, foodItems: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Your Pickup Address *</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Street name, landmark, city"
                  value={foodDetails.pickupAddress}
                  onChange={(e) => setFoodDetails({ ...foodDetails, pickupAddress: e.target.value })}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label>Available From</label>
                  <input
                    type="time"
                    className="form-control"
                    value={foodDetails.availableFrom}
                    onChange={(e) => setFoodDetails({ ...foodDetails, availableFrom: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Available Until</label>
                  <input
                    type="time"
                    className="form-control"
                    value={foodDetails.availableUntil}
                    onChange={(e) => setFoodDetails({ ...foodDetails, availableUntil: e.target.value })}
                  />
                </div>
              </div>

              {/* Delivery Method Selection */}
              <div className="form-group" style={{ background: '#f9fafb', padding: '1rem', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                <label style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.5rem', display: 'block' }}>
                  How will the food be delivered? *
                </label>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontWeight: 500 }}>
                    <input
                      type="radio"
                      name="deliveryMethod"
                      value="DIRECT"
                      checked={deliveryMethod === 'DIRECT'}
                      onChange={() => setDeliveryMethod('DIRECT')}
                    />
                    🚲 <strong>I will deliver directly</strong> (No volunteer required)
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontWeight: 500 }}>
                    <input
                      type="radio"
                      name="deliveryMethod"
                      value="VOLUNTEER_REQUIRED"
                      checked={deliveryMethod === 'VOLUNTEER_REQUIRED'}
                      onChange={() => setDeliveryMethod('VOLUNTEER_REQUIRED')}
                    />
                    🚗 <strong>I need a volunteer</strong> (Admin will assign volunteer & vehicle)
                  </label>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setSelectedReq(null)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Confirming...' : 'Confirm & Initiate Fulfillment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AvailableRequirements;
