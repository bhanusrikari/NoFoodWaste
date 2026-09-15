const mongoose = require('mongoose');

const deliverySchema = new mongoose.Schema(
  {
    deliveryId: {
      type: String,
      unique: true,
      trim: true,
    },
    foodRequest: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'FoodRequest',
      default: null,
    },
    donation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Donation',
      default: null,
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    donor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    volunteer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    vehicle: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vehicle',
      default: null,
    },
    vehicleNumber: {
      type: String,
      trim: true,
      default: '',
    },
    customerName: {
      type: String,
      required: true,
      trim: true,
    },
    donorName: {
      type: String,
      default: 'Community Donor',
      trim: true,
    },
    volunteerName: {
      type: String,
      default: 'Unassigned',
      trim: true,
    },
    volunteerPhone: {
      type: String,
      default: '',
    },
    numberOfMeals: {
      type: Number,
      required: true,
    },
    pickupLocation: {
      type: String,
      default: '',
    },
    deliveryLocation: {
      type: String,
      default: '',
    },
    deliveryMethod: {
      type: String,
      enum: ['VOLUNTEER_PICKUP', 'DONOR_SELF_DROP'],
      default: 'VOLUNTEER_PICKUP',
    },
    requiredDeliveryDate: {
      type: String,
      default: '',
    },
    requiredDeliveryTime: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: {
        values: [
          'PENDING_MATCH',
          'PENDING_ASSIGNMENT',
          'PENDING_REASSIGNMENT',
          'ASSIGNED',
          'ACCEPTED',
          'GOING_TO_PICKUP',
          'FOOD_COLLECTED',
          'OUT_FOR_DELIVERY',
          'DELIVERED',
          'ACKNOWLEDGED',
          'COMPLETED',
          'CANCELLED',
          'PICKED_UP',
          'IN_TRANSIT',
        ],
        message: 'Invalid delivery status',
      },
      default: 'PENDING_MATCH',
    },
    currentStage: {
      type: String,
      default: 'Customer Request',
    },
    isDelayed: {
      type: Boolean,
      default: false,
    },
    acceptedAt: { type: Date, default: null },
    goingToPickupAt: { type: Date, default: null },
    foodCollectedAt: { type: Date, default: null },
    outForDeliveryAt: { type: Date, default: null },
    deliveredAt: { type: Date, default: null },
    acknowledgedAt: { type: Date, default: null },
    completedAt: { type: Date, default: null },
    lifecycleLogs: [
      {
        status: String,
        timestamp: { type: Date, default: Date.now },
        updatedBy: { type: String, default: 'System' },
        note: { type: String, default: '' },
      },
    ],
    acknowledgement: {
      isAcknowledged: {
        type: Boolean,
        default: false,
      },
      feedback: {
        type: String,
        default: '',
      },
      rating: {
        type: Number,
        default: 5,
      },
      acknowledgedAt: {
        type: Date,
        default: null,
      },
    },
  },
  {
    timestamps: true,
  }
);

// Pre-save hook to generate deliveryId
deliverySchema.pre('save', async function (next) {
  if (!this.deliveryId) {
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const timestampSuffix = Date.now().toString().slice(-4);
    this.deliveryId = `DEL-${timestampSuffix}${randomSuffix}`;
  }
  next();
});

deliverySchema.set('toJSON', {
  transform: function (doc, ret) {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

const Delivery = mongoose.model('Delivery', deliverySchema);

module.exports = Delivery;
