const mongoose = require('mongoose');

const foodRequestSchema = new mongoose.Schema(
  {
    requestId: {
      type: String,
      unique: true,
      trim: true,
    },
    customerName: {
      type: String,
      required: [true, 'Customer/Organization name is required'],
      trim: true,
    },
    organizationName: {
      type: String,
      trim: true,
      default: '',
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
    location: {
      type: String,
      required: [true, 'Location/Address is required'],
      trim: true,
    },
    city: {
      type: String,
      trim: true,
      default: '',
    },
    requiredDate: {
      type: String,
      required: [true, 'Required date is required'],
    },
    requiredTime: {
      type: String,
      required: [true, 'Required time is required'],
    },
    status: {
      type: String,
      enum: {
        values: [
          'SUBMITTED',
          'PENDING',
          'VERIFIED',
          'OPEN',
          'DONOR_MATCHED',
          'PARTIALLY_FULFILLED',
          'FULFILLED',
          'DELIVERY_ARRANGED',
          'DELIVERED',
          'ACKNOWLEDGED',
          'COMPLETED',
          'REJECTED',
          'CANCELLED',
        ],
        message: 'Invalid request status',
      },
      default: 'SUBMITTED',
    },
    matchedDonor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Donation',
      default: null,
    },
    matchedDonorDetails: {
      donorName: { type: String, default: '' },
      phone: { type: String, default: '' },
      foodTitle: { type: String, default: '' },
      pickupLocation: { type: String, default: '' },
    },
    delivery: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Delivery',
      default: null,
    },
    deliveryDetails: {
      deliveryId: { type: String, default: '' },
      volunteerName: { type: String, default: '' },
      status: { type: String, default: '' },
    },
    lifecycleLogs: [
      {
        status: { type: String, required: true },
        note: { type: String, default: '' },
        updatedBy: { type: String, default: 'System' },
        timestamp: { type: Date, default: Date.now },
      },
    ],
    adminNotes: {
      type: String,
      trim: true,
      default: '',
    },
    rejectionReason: {
      type: String,
      trim: true,
      default: '',
    },
    cancellationReason: {
      type: String,
      trim: true,
      default: '',
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Pre-save hook to generate custom requestId and initialize first lifecycle log
foodRequestSchema.pre('save', async function (next) {
  if (!this.requestId) {
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const timestampSuffix = Date.now().toString().slice(-4);
    this.requestId = `REQ-${timestampSuffix}${randomSuffix}`;
  }

  if (this.isNew && (!this.lifecycleLogs || this.lifecycleLogs.length === 0)) {
    this.lifecycleLogs = [
      {
        status: this.status,
        note: 'Customer food requirement submitted',
        updatedBy: this.customerName || 'Customer',
        timestamp: new Date(),
      },
    ];
  }
  next();
});

foodRequestSchema.set('toJSON', {
  transform: function (doc, ret) {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

const FoodRequest = mongoose.models.FoodRequest || mongoose.model('FoodRequest', foodRequestSchema);

module.exports = FoodRequest;
