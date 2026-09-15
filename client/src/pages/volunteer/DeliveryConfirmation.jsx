import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import volunteerService from '../../features/volunteer/volunteerService';
import '../../features/volunteer/volunteer.css';

const DeliveryConfirmation = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [assignment, setAssignment] = useState(null);
  const [collection, setCollection] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Form fields
  const [distributedQuantityValue, setDistributedQuantityValue] = useState('');
  const [peopleServed, setPeopleServed] = useState('');
  const [notes, setNotes] = useState('');
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [assignRes, collectRes] = await Promise.all([
          volunteerService.getAssignment(id),
          volunteerService.getCollection(id).catch(() => null),
        ]);
        setAssignment(assignRes.assignment);
        if (collectRes?.collection) {
          setCollection(collectRes.collection);
          setDistributedQuantityValue(collectRes.collection.collectedQuantity?.value || '');
        } else if (assignRes.assignment?.quantity) {
          setDistributedQuantityValue(assignRes.assignment.quantity.value || assignRes.assignment.quantity);
        }
      } catch (err) {
        setError(err.message || 'Failed to load delivery details.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
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
    if (!distributedQuantityValue || Number(distributedQuantityValue) < 1) {
      setError('Please enter a valid distributed quantity (at least 1).');
      return;
    }

    const maxQty = collection?.collectedQuantity?.value || assignment?.quantity?.value || assignment?.quantity;
    if (Number(distributedQuantityValue) > Number(maxQty)) {
      setError(`Distributed quantity cannot exceed collected quantity (${maxQty}).`);
      return;
    }

    if (!peopleServed || Number(peopleServed) < 1) {
      setError('Please enter the estimated number of people served (at least 1).');
      return;
    }

    try {
      setSubmitting(true);
      setError('');

      let deliveryPhotoUrl = '';
      if (photoFile) {
        const uploadRes = await volunteerService.uploadPhoto(photoFile);
        deliveryPhotoUrl = uploadRes.fileUrl || uploadRes.url;
      }

      // Record distribution
      await volunteerService.createDistribution({
        assignmentId: id,
        distributedQuantity: {
          value: Number(distributedQuantityValue),
          unit: assignment?.quantity?.unit || 'MEALS',
        },
        peopleServed: Number(peopleServed),
        deliveryPhotoUrl,
        notes,
      });

      // Confirm delivery (IN_TRANSIT -> DELIVERED)
      await volunteerService.confirmDelivery(id);

      navigate(`/volunteer/assignments/${id}`);
    } catch (err) {
      setError(err.message || 'Failed to confirm delivery.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="volunteer-dashboard">
        <div className="loading-state">
          <span className="loading-spinner"></span> Loading delivery confirmation form...
        </div>
      </div>
    );
  }

  const maxQty = collection?.collectedQuantity?.value || assignment?.quantity?.value || assignment?.quantity;
  const qtyUnit = assignment?.quantity?.unit || 'MEALS';
  const beneficiaryName = assignment?.beneficiaryId?.name || 'Beneficiary';

  return (
    <div className="volunteer-dashboard" style={{ maxWidth: '800px', margin: '0 auto', padding: '1.5rem' }}>
      <Link to={`/volunteer/assignments/${id}`} className="back-link">
        ← Back to Assignment
      </Link>

      <div className="section-header" style={{ marginTop: '1rem', marginBottom: '1.5rem' }}>
        <h2>📋 Confirm Food Delivery</h2>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>
          Record delivery details for <strong>{beneficiaryName}</strong>. Once submitted, the assignment moves to DELIVERED status.
        </p>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      <form onSubmit={handleSubmit} style={{ background: '#fff', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
        <div className="form-group" style={{ marginBottom: '1.25rem' }}>
          <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.5rem' }}>
            Distributed Quantity ({qtyUnit}) *
          </label>
          <input
            type="number"
            min="1"
            max={maxQty}
            className="form-control"
            value={distributedQuantityValue}
            onChange={(e) => setDistributedQuantityValue(e.target.value)}
            required
            style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #ddd' }}
          />
          <small style={{ color: '#666' }}>Maximum available from collection: {maxQty} {qtyUnit}</small>
        </div>

        <div className="form-group" style={{ marginBottom: '1.25rem' }}>
          <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.5rem' }}>
            Estimated People Served *
          </label>
          <input
            type="number"
            min="1"
            placeholder="e.g. 50"
            className="form-control"
            value={peopleServed}
            onChange={(e) => setPeopleServed(e.target.value)}
            required
            style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #ddd' }}
          />
        </div>

        {/* Photo upload */}
        <div className="form-group" style={{ marginBottom: '1.25rem' }}>
          <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.5rem' }}>
            Delivery Proof Photo (optional)
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
                alt="Delivery Preview"
                style={{ maxWidth: '200px', maxHeight: '150px', borderRadius: '8px', objectFit: 'cover' }}
              />
            </div>
          )}
        </div>

        <div className="form-group" style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.5rem' }}>
            Delivery Notes / Recipient Feedback
          </label>
          <textarea
            rows="3"
            className="form-control"
            placeholder="Any notes from the handover..."
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
            {submitting ? '⏳ Submitting Delivery...' : '📦 Confirm Handover'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default DeliveryConfirmation;
