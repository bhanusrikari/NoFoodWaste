const mongoose = require('mongoose');

const donationSchema = new mongoose.Schema(
  {
    donationId: {
      type: String,
      unique: true,
      trim: true,
    },
    donor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    donorName: {
      type: String,
      required: [true, 'Donor name is required'],
      trim: true,
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: '',
    },
    foodTitle: {
      type: String,
      required: [true, 'Food title is required'],
      trim: true,
    },
    numberOfMeals: {
      type: Number,
      required: [true, 'Number of meals is required'],
      min: [1, 'Number of meals must be at least 1'],
    },
    foodType: {
      type: String,
      required: [true, 'Food type is required'],
      enum: {
        values: ['Veg', 'Non-Veg', 'Both'],
        message: 'Food type must be Veg, Non-Veg, or Both',
      },
    },
    foodCategory: {
      type: String,
      required: [true, 'Food category is required'],
      enum: {
        values: ['Cooked', 'Raw/Groceries', 'Packaged', 'Bakery', 'Other'],
        message: 'Food category must be Cooked, Raw/Groceries, Packaged, Bakery, or Other',
      },
    },
    donationOrigin: {
      type: String,
      enum: {
        values: ['DIRECT_DONATION', 'REQUEST_FULFILLMENT'],
        message: 'Origin must be DIRECT_DONATION or REQUEST_FULFILLMENT',
      },
      default: 'DIRECT_DONATION',
    },
    availableDate: {
      type: String,
      default: function () {
        return new Date().toISOString().split('T')[0];
      },
    },
    availableTime: {
      type: String,
      default: '14:00',
    },
    pickupLocation: {
      type: String,
      required: [true, 'Pickup location is required'],
      trim: true,
    },
    city: {
      type: String,
      trim: true,
      default: '',
    },
    deliveryMethod: {
      type: String,
      enum: {
        values: ['VOLUNTEER_PICKUP', 'DONOR_SELF_DROP', 'THIRD_PARTY_COURIER'],
        message: 'Invalid delivery method',
      },
      default: 'VOLUNTEER_PICKUP',
    },
    matchedRequest: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'FoodRequest',
      default: null,
    },
    matchedBeneficiary: {
      customerName: { type: String, default: 'Awaiting Beneficiary' },
      organizationName: { type: String, default: '' },
      phone: { type: String, default: '' },
      location: { type: String, default: '' },
      requestId: { type: String, default: '' },
    },
    delivery: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Delivery',
      default: null,
    },
    volunteerDetails: {
      volunteerName: { type: String, default: 'Unassigned' },
      vehicleNumber: { type: String, default: '' },
      phone: { type: String, default: '' },
    },
    status: {
      type: String,
      enum: {
        values: [
          'SUBMITTED',
          'VERIFIED',
          'AVAILABLE',
          'MATCHED',
          'ASSIGNED',
          'IN_TRANSIT',
          'COMPLETED',
          'CANCELLED',
          'FLAGGED',
        ],
        message: 'Invalid donation status',
      },
      default: 'SUBMITTED',
    },
    flagReason: {
      type: String,
      trim: true,
      default: '',
    },
    cancellationReason: {
      type: String,
      trim: true,
      default: '',
    },
    notes: {
      type: String,
      trim: true,
      default: '',
    },
    lifecycleLogs: [
      {
        status: { type: String, required: true },
        note: { type: String, default: '' },
        updatedBy: { type: String, default: 'System' },
        timestamp: { type: Date, default: Date.now },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Pre-save hook to generate donationId and initial lifecycle log
donationSchema.pre('save', async function (next) {
  if (!this.donationId) {
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const timestampSuffix = Date.now().toString().slice(-4);
    this.donationId = `DON-${timestampSuffix}${randomSuffix}`;
  }

  if (this.isNew && (!this.lifecycleLogs || this.lifecycleLogs.length === 0)) {
    this.lifecycleLogs = [
      {
        status: this.status,
        note: `Donation created via ${this.donationOrigin}`,
        updatedBy: this.donorName || 'Donor',
        timestamp: new Date(),
      },
    ];
  }
  next();
});

donationSchema.set('toJSON', {
  transform: function (doc, ret) {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

const Donation = mongoose.model('Donation', donationSchema);

module.exports = Donation;
