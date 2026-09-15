const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema(
  {
    reportId: {
      type: String,
      unique: true,
      trim: true,
    },
    reporterName: {
      type: String,
      required: true,
      trim: true,
    },
    reporterEmail: {
      type: String,
      default: '',
      trim: true,
    },
    reporterRole: {
      type: String,
      enum: ['CUSTOMER', 'DONOR', 'VOLUNTEER', 'ADMIN', 'SYSTEM'],
      default: 'CUSTOMER',
    },
    issueType: {
      type: String,
      enum: [
        'FOOD_QUALITY',
        'INCORRECT_QUANTITY',
        'DELIVERY_ISSUE',
        'DONOR_ISSUE',
        'VOLUNTEER_ISSUE',
        'RECIPIENT_ISSUE',
        'OTHER',
      ],
      default: 'OTHER',
    },
    relatedEntity: {
      type: String,
      enum: ['FoodRequest', 'Donation', 'Delivery', 'User', 'Vehicle', 'System'],
      default: 'Delivery',
    },
    relatedEntityId: {
      type: String,
      default: '',
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    priority: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'],
      default: 'MEDIUM',
    },
    status: {
      type: String,
      enum: ['OPEN', 'INVESTIGATING', 'RESOLVED', 'CLOSED'],
      default: 'OPEN',
    },
    resolutionNotes: {
      type: String,
      default: '',
      trim: true,
    },
    logs: [
      {
        status: String,
        timestamp: { type: Date, default: Date.now },
        updatedBy: { type: String, default: 'System' },
        note: { type: String, default: '' },
      },
    ],
  },
  {
    timestamps: true,
  }
);

reportSchema.pre('save', async function (next) {
  if (!this.reportId) {
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const timestampSuffix = Date.now().toString().slice(-4);
    this.reportId = `REP-${timestampSuffix}${randomSuffix}`;
  }
  next();
});

reportSchema.set('toJSON', {
  transform: function (doc, ret) {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

const Report = mongoose.model('Report', reportSchema);

module.exports = Report;
