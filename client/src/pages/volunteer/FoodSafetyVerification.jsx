import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import volunteerService from '../../features/volunteer/volunteerService';
import '../../features/volunteer/volunteer.css';

const FoodSafetyVerification = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [assignment, setAssignment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Form state
  const [collectedQuantityValue, setCollectedQuantityValue] = useState('');
  const [preparationTime, setPreparationTime] = useState('');
  const [temperature, setTemperature] = useState('');
  const [temperatureUnit, setTemperatureUnit] = useState('C');
  const [temperatureChecked, setTemperatureChecked] = useState(false);
  const [properlyPacked, setProperlyPacked] = useState(false);
  const [packagingIntact, setPackagingIntact] = useState(false);
  const [noVisibleContamination, setNoVisibleContamination] = useState(false);
  const [notes, setNotes] = useState('');
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState('');

  useEffect(() => {
    const fetchAssignment = async () => {
      try {
        setLoading(true);
        const res = await volunteerService.getAssignment(id);
        setAssignment(res.assignment);
        if (res.assignment?.quantity) {
          setCollectedQuantityValue(res.assignment.quantity.value || res.assignment.quantity);
        }
      } catch (err) {
        setError(err.message || 'Failed to load assignment details.');
      } finally {
        setLoading(false);
      }
    };
    fetchAssignment();
  }, [id]);

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!collectedQuantityValue || Number(collectedQuantityValue) < 1) {
      setError('Please enter a valid collected quantity (at least 1).');
      return;
    }

    const expectedQty = assignment.quantity?.value || assignment.quantity;
    if (Number(collectedQuantityValue) > Number(expectedQty)) {
      setError(`Collected quantity cannot exceed expected quantity (${expectedQty}).`);
      return;
    }

    try {
      setSubmitting(true);
      setError('');

      let collectionPhotoUrl = '';
      if (photoFile) {
        const uploadRes = await volunteerService.uploadPhoto(photoFile);
        collectionPhotoUrl = uploadRes.fileUrl || uploadRes.url;
      }

      // Create collection record
      await volunteerService.createCollection({
        assignmentId: id,
        collectedQuantity: {
          value: Number(collectedQuantityValue),
          unit: assignment.quantity?.unit || 'MEALS',
        },
        foodSafety: {
          preparationTime,
          temperature: temperature ? Number(temperature) : null,
          temperatureUnit,
          temperatureChecked,
          properlyPacked,
          packagingIntact,
          noVisibleContamination,
          notes,
        },
        collectionPhotoUrl,
      });

      // Transition assignment to COLLECTED
      await volunteerService.confirmCollection(id);

      navigate(`/volunteer/assignments/${id}`);
    } catch (err) {
      setError(err.message || 'Failed to complete food safety verification and collection.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="volunteer-dashboard">
        <div className="loading-state">
          <span className="loading-spinner"></span> Loading verification form...
        </div>
      </div>
    );
  }

  const expectedQty = assignment?.quantity?.value || assignment?.quantity;
  const qtyUnit = assignment?.quantity?.unit || 'MEALS';

  return (
    <div className="volunteer-dashboard" style={{ maxWidth: '800px', margin: '0 auto', padding: '1.5rem' }}>
      <Link to={`/volunteer/assignments/${id}`} className="back-link">
        ← Back to Assignment
      </Link>

      <div className="section-header" style={{ marginTop: '1rem', marginBottom: '1.5rem' }}>
        <h2>🔍 Food Safety Verification & Collection</h2>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>
          Verify and record food condition according to organizational safety SOP before transport.
        </p>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      <form onSubmit={handleSubmit} className="verification-form" style={{ background: '#fff', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
        <div className="form-group" style={{ marginBottom: '1.25rem' }}>
          <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.5rem' }}>
            Collected Quantity ({qtyUnit}) *
          </label>
          <input
            type="number"
            min="1"
            max={expectedQty}
            className="form-control"
            value={collectedQuantityValue}
            onChange={(e) => setCollectedQuantityValue(e.target.value)}
            required
            style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #ddd' }}
          />
          <small style={{ color: '#666' }}>Expected quantity: {expectedQty} {qtyUnit}</small>
        </div>

        <div className="form-group" style={{ marginBottom: '1.25rem' }}>
          <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.5rem' }}>
            Food Preparation Time / Notes
          </label>
          <input
            type="text"
            className="form-control"
            placeholder="e.g. Cooked today at 11:30 AM"
            value={preparationTime}
            onChange={(e) => setPreparationTime(e.target.value)}
            style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #ddd' }}
          />
        </div>

        {/* Temperature check */}
        <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '8px', marginBottom: '1.25rem' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: '600', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={temperatureChecked}
              onChange={(e) => setTemperatureChecked(e.target.checked)}
            />
            Temperature check performed
          </label>
          {temperatureChecked && (
            <div style={{ display: 'flex', gap: '1rem', marginTop: '0.75rem' }}>
              <input
                type="number"
                step="0.1"
                placeholder="Recorded temp"
                className="form-control"
                value={temperature}
                onChange={(e) => setTemperature(e.target.value)}
                style={{ flex: 1, padding: '0.5rem', borderRadius: '6px', border: '1px solid #ccc' }}
              />
              <select
                value={temperatureUnit}
                onChange={(e) => setTemperatureUnit(e.target.value)}
                style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid #ccc' }}
              >
                <option value="C">°C</option>
                <option value="F">°F</option>
              </select>
            </div>
          )}
        </div>

        {/* Safety checklist */}
        <div style={{ marginBottom: '1.25rem' }}>
          <h4 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.75rem' }}>Safety Observation Checklist</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={properlyPacked}
                onChange={(e) => setProperlyPacked(e.target.checked)}
              />
              Food is properly packed in clean containers
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={packagingIntact}
                onChange={(e) => setPackagingIntact(e.target.checked)}
              />
              Packaging is intact with no leaks or tears
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={noVisibleContamination}
                onChange={(e) => setNoVisibleContamination(e.target.checked)}
              />
              No visible signs of spoilage or contamination
            </label>
          </div>
        </div>

        {/* Photo upload */}
        <div className="form-group" style={{ marginBottom: '1.25rem' }}>
          <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.5rem' }}>
            Collection Photo (optional)
          </label>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handlePhotoChange}
            style={{ display: 'block', marginBottom: '0.5rem' }}
          />
          {photoPreview && (
            <div style={{ marginTop: '0.5rem' }}>
              <img
                src={photoPreview}
                alt="Collection Preview"
                style={{ maxWidth: '200px', maxHeight: '150px', borderRadius: '8px', objectFit: 'cover' }}
              />
            </div>
          )}
        </div>

        {/* Additional notes */}
        <div className="form-group" style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.5rem' }}>
            Verification Notes
          </label>
          <textarea
            rows="3"
            className="form-control"
            placeholder="Any notable observations about the food condition..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #ddd' }}
          />
        </div>

        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => navigate(`/volunteer/assignments/${id}`)}
            disabled={submitting}
            style={{ padding: '0.75rem 1.5rem', borderRadius: '8px', border: '1px solid #ccc', background: '#f1f5f9' }}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn btn-primary btn-action"
            disabled={submitting}
            style={{ padding: '0.75rem 1.5rem', borderRadius: '8px', background: '#16a34a', color: '#fff', border: 'none', fontWeight: '600' }}
          >
            {submitting ? '⏳ Saving & Confirming...' : '✅ Confirm Collection'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default FoodSafetyVerification;
