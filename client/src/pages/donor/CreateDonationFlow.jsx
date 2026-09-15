import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fulfillmentService } from '../../services/fulfillmentService';
import { foodRequirementService } from '../../services/foodRequirementService';

const CreateDonationFlow = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    donorType: 'Individual',
    foodType: 'Cooked Meal',
    cuisine: 'South Indian',
    foodItems: 'Rice, Dal, Vegetable Curry',
    quantity: 50,
    unit: 'Meals',
    description: 'Freshly prepared food from today\'s event.',
    preparedAt: new Date().toISOString().slice(0, 16),
    expiry: new Date(Date.now() + 86400000).toISOString().slice(0, 16),
    pickupAddress: '123 Green Street, Tech Park Area',
    availableFrom: '14:00',
    availableUntil: '20:00',
    specialInstructions: 'Please carry thermal containers.',
  });

  // Flow State
  const [openReqs, setOpenReqs] = useState([]);
  const [beneficiaries, setBeneficiaries] = useState([]);
  const [selectedBeneficiary, setSelectedBeneficiary] = useState(null);
  const [deliveryMethod, setDeliveryMethod] = useState('DIRECT');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleStep1Submit = async (e) => {
    e.preventDefault();
    setError('');

    if (new Date(formData.expiry) <= new Date(formData.preparedAt)) {
      setError('Expiry time must be after prepared time');
      return;
    }

    try {
      setLoading(true);
      const [reqData, benData] = await Promise.all([
        foodRequirementService.getOpen(),
        fulfillmentService.getBeneficiaries(),
      ]);

      setOpenReqs(reqData.requirements || []);
      setBeneficiaries(benData.beneficiaries || []);
      setStep(2); // Search matching requirements
    } catch (err) {
      setError(err.message || 'Failed to search requirements');
    } finally {
      setLoading(false);
    }
  };

  const handleFinalSubmit = async () => {
    if (!selectedBeneficiary) {
      alert('Please select a beneficiary to donate to');
      return;
    }

    try {
      setLoading(true);
      const res = await fulfillmentService.fulfillBeneficiary({
        beneficiaryId: selectedBeneficiary.id,
        beneficiaryName: selectedBeneficiary.name,
        beneficiaryLocation: selectedBeneficiary.location,
        deliveryMethod,
        foodDetails: formData,
      });

      if (res.success) {
        alert('Donation created and fulfillment initialized successfully!');
        navigate(`/donor/fulfillments/${res.fulfillment.id}`);
      }
    } catch (err) {
      setError(err.message || 'Failed to complete donation');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ maxWidth: '800px' }}>
      <div className="dashboard-header">
        <h1>Donate Food to Someone in Need</h1>
        <p>Step {step} of 3 — Food Redistribution Workflow</p>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {/* STEP 1: Enter Food Information */}
      {step === 1 && (
        <div className="auth-card" style={{ maxWidth: '100%' }}>
          <form onSubmit={handleStep1Submit}>
            <h3 style={{ marginBottom: '1.25rem', color: '#111827' }}>1. Donor & Food Information</h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label>Donor Category</label>
                <select name="donorType" className="form-control" value={formData.donorType} onChange={handleChange}>
                  <option value="Individual">Individual</option>
                  <option value="Hotel">Hotel</option>
                  <option value="Restaurant">Restaurant</option>
                  <option value="Caterer">Caterer</option>
                  <option value="Event Organizer">Event Organizer</option>
                  <option value="Organization">Organization</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="form-group">
                <label>Food Type *</label>
                <select name="foodType" className="form-control" value={formData.foodType} onChange={handleChange} required>
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
                <label>Cuisine *</label>
                <input type="text" name="cuisine" className="form-control" placeholder="South Indian, North Indian, Bakery..." value={formData.cuisine} onChange={handleChange} required />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '0.5rem' }}>
                <div className="form-group">
                  <label>Quantity *</label>
                  <input type="number" name="quantity" className="form-control" min="1" value={formData.quantity} onChange={handleChange} required />
                </div>
                <div className="form-group">
                  <label>Unit</label>
                  <select name="unit" className="form-control" value={formData.unit} onChange={handleChange}>
                    <option value="Meals">Meals</option>
                    <option value="Packets">Packets</option>
                    <option value="Kg">Kg</option>
                    <option value="Litres">Litres</option>
                    <option value="Boxes">Boxes</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="form-group">
              <label>Food Items Description *</label>
              <input type="text" name="foodItems" className="form-control" placeholder="e.g. Rice, Dal, Chapati, Mixed Vegetable Curry" value={formData.foodItems} onChange={handleChange} required />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label>Prepared At *</label>
                <input type="datetime-local" name="preparedAt" className="form-control" value={formData.preparedAt} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label>Best Before / Expiry *</label>
                <input type="datetime-local" name="expiry" className="form-control" value={formData.expiry} onChange={handleChange} required />
              </div>
            </div>

            <div className="form-group">
              <label>Pickup Address *</label>
              <input type="text" name="pickupAddress" className="form-control" placeholder="Address where food can be collected" value={formData.pickupAddress} onChange={handleChange} required />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label>Pickup Available From</label>
                <input type="time" name="availableFrom" className="form-control" value={formData.availableFrom} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label>Pickup Available Until</label>
                <input type="time" name="availableUntil" className="form-control" value={formData.availableUntil} onChange={handleChange} />
              </div>
            </div>

            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Searching...' : 'Continue to Find Beneficiary →'}
            </button>
          </form>
        </div>
      )}

      {/* STEP 2: Matching Existing Open Requests */}
      {step === 2 && (
        <div className="card-table">
          <h3>2. Matching Existing Food Requirements</h3>
          <p style={{ color: '#6b7280', marginBottom: '1.25rem' }}>
            We checked open requests posted by local shelters and orphanages.
          </p>

          {openReqs.length > 0 ? (
            <div className="alert alert-success">
              Found <strong>{openReqs.length} active requirement(s)</strong>! You can fulfill an existing request or discover nearby verified beneficiaries below.
            </div>
          ) : (
            <div className="alert alert-info">
              No matching open food requests currently exist for your exact criteria. You can select a verified beneficiary nearby!
            </div>
          )}

          <div style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem' }}>
            <button className="btn btn-secondary" onClick={() => setStep(1)}>
              ← Back to Edit Details
            </button>
            <button className="btn btn-primary" onClick={() => setStep(3)}>
              Proceed to Discover Beneficiaries →
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: Select Beneficiary & Delivery Method */}
      {step === 3 && (
        <div className="card-table">
          <h3>3. Select Beneficiary & Delivery Method</h3>
          <p style={{ color: '#6b7280', marginBottom: '1rem' }}>
            Choose a verified local beneficiary home/shelter to receive your food donation.
          </p>

          <div className="beneficiary-grid">
            {beneficiaries.map((b) => (
              <div
                key={b.id}
                className={`beneficiary-card ${selectedBeneficiary?.id === b.id ? 'selected' : ''}`}
                onClick={() => setSelectedBeneficiary(b)}
              >
                <h4>{b.name}</h4>
                <p>📍 {b.location}</p>
                <p>👥 Needs: <strong>{b.currentNeed}</strong></p>
                <p>📞 Contact: {b.contactPerson} ({b.phone})</p>
              </div>
            ))}
          </div>

          {selectedBeneficiary && (
            <div className="alert alert-success" style={{ marginTop: '1rem' }}>
              Selected Beneficiary: <strong>{selectedBeneficiary.name}</strong> ({selectedBeneficiary.location})
            </div>
          )}

          {/* Delivery Method Selector */}
          <div className="form-group" style={{ background: '#f9fafb', padding: '1.25rem', borderRadius: '10px', border: '1px solid #e5e7eb', marginTop: '1.5rem' }}>
            <label style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.75rem', display: 'block' }}>
              How would you like the food to be delivered? *
            </label>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer', fontSize: '0.95rem' }}>
                <input
                  type="radio"
                  name="deliveryMethod"
                  value="DIRECT"
                  checked={deliveryMethod === 'DIRECT'}
                  onChange={() => setDeliveryMethod('DIRECT')}
                />
                🚲 <strong>I will deliver directly</strong> (Donor handles transport directly to recipient)
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer', fontSize: '0.95rem' }}>
                <input
                  type="radio"
                  name="deliveryMethod"
                  value="VOLUNTEER_REQUIRED"
                  checked={deliveryMethod === 'VOLUNTEER_REQUIRED'}
                  onChange={() => setDeliveryMethod('VOLUNTEER_REQUIRED')}
                />
                🚗 <strong>I need a volunteer to collect and deliver</strong> (Admin will assign a volunteer & vehicle)
              </label>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
            <button className="btn btn-secondary" onClick={() => setStep(2)}>
              ← Back
            </button>
            <button className="btn btn-primary" onClick={handleFinalSubmit} disabled={loading || !selectedBeneficiary}>
              {loading ? 'Submitting...' : 'Confirm & Donate Food Now →'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreateDonationFlow;
