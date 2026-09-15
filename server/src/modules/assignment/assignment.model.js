const mongoose = require('mongoose');

const ASSIGNMENT_STATUSES = [
  'ASSIGNED',
  'VOLUNTEER_ACCEPTED',
  'PICKUP_STARTED',
  'COLLECTED',
  'IN_TRANSIT',
  'DELIVERED',
  'COMPLETED',
  'CANCELLED',
];

const ACTIVE_STATUSES = [
  'ASSIGNED',
  'VOLUNTEER_ACCEPTED',
  'PICKUP_STARTED',
  'COLLECTED',
  'IN_TRANSIT',
  'DELIVERED',
];

const QUANTITY_UNITS = ['MEALS', 'KG', 'PACKETS', 'CONTAINERS'];

const assignmentSchema = new mongoose.Schema(
  {
    foodRequestId: {
      type: String,
      required: [true, 'Food request ID is required'],
      trim: true,
    },
    donorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Donor ID is required'],
    },
    beneficiaryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Beneficiary',
      required: [true, 'Beneficiary ID is required'],
    },
    volunteerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Volunteer ID is required'],
    },
    vehicleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vehicle',
      required: [true, 'Vehicle ID is required'],
    },

    // Pickup info
    pickupLocation: {
      latitude: { type: Number, default: null },
      longitude: { type: Number, default: null },
    },
    pickupAddress: {
      type: String,
      required: [true, 'Pickup address is required'],
      trim: true,
    },

    // Delivery info
    deliveryLocation: {
      latitude: { type: Number, default: null },
      longitude: { type: Number, default: null },
    },
    deliveryAddress: {
      type: String,
      required: [true, 'Delivery address is required'],
      trim: true,
    },

    // Food info
    foodType: {
      type: String,
      required: [true, 'Food type is required'],
      trim: true,
    },
    quantity: {
      value: {
        type: Number,
        required: [true, 'Quantity value is required'],
        min: [1, 'Quantity value must be at least 1'],
      },
      unit: {
        type: String,
        required: [true, 'Quantity unit is required'],
        enum: {
          values: QUANTITY_UNITS,
          message: `Unit must be one of: ${QUANTITY_UNITS.join(', ')}`,
        },
        default: 'MEALS',
      },
    },

    // Status
    status: {
      type: String,
      enum: {
        values: ASSIGNMENT_STATUSES,
        message: `Status must be one of: ${ASSIGNMENT_STATUSES.join(', ')}`,
      },
      default: 'ASSIGNED',
    },

    // Active flag for partial unique index guarantee
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },

    // Timestamps for each stage
    assignedAt: { type: Date, default: Date.now },
    acceptedAt: { type: Date, default: null },
    pickupStartedAt: { type: Date, default: null },
    collectedAt: { type: Date, default: null },
    transportStartedAt: { type: Date, default: null },
    deliveredAt: { type: Date, default: null },
    completedAt: { type: Date, default: null },
    cancelledAt: { type: Date, default: null },
    cancellationReason: { type: String, default: null },
  },
  {
    timestamps: true,
  }
);

// Database-level guarantee: MAXIMUM ONE ACTIVE ASSIGNMENT per foodRequestId
// Uses partial unique index on foodRequestId where isActive: true
assignmentSchema.index(
  { foodRequestId: 1 },
  {
    unique: true,
    partialFilterExpression: {
      isActive: true,
    },
    name: 'unique_active_assignment_per_food_request',
  }
);

// Index for volunteer queries
assignmentSchema.index({ volunteerId: 1, status: 1 });
assignmentSchema.index({ volunteerId: 1, isActive: 1 });

assignmentSchema.set('toJSON', {
  transform: function (doc, ret) {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

const Assignment = mongoose.model('Assignment', assignmentSchema);

// Export constants for reuse
Assignment.STATUSES = ASSIGNMENT_STATUSES;
Assignment.ACTIVE_STATUSES = ACTIVE_STATUSES;
Assignment.QUANTITY_UNITS = QUANTITY_UNITS;

module.exports = Assignment;
