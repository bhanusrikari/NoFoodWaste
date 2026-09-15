const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema(
  {
    logId: {
      type: String,
      unique: true,
      trim: true,
    },
    actorName: {
      type: String,
      default: 'System',
      trim: true,
    },
    actorEmail: {
      type: String,
      default: '',
      trim: true,
    },
    actorRole: {
      type: String,
      enum: ['SYSTEM', 'ADMIN', 'DONOR', 'VOLUNTEER', 'CUSTOMER'],
      default: 'SYSTEM',
    },
    actionType: {
      type: String,
      required: true,
      trim: true,
    },
    relatedEntity: {
      type: String,
      enum: ['FoodRequest', 'Donation', 'Delivery', 'User', 'Vehicle', 'Report', 'Beneficiary', 'System'],
      default: 'System',
    },
    relatedEntityId: {
      type: String,
      default: '',
      trim: true,
    },
    previousStatus: {
      type: String,
      default: '',
    },
    newStatus: {
      type: String,
      default: '',
    },
    details: {
      type: String,
      default: '',
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

activityLogSchema.pre('save', async function (next) {
  if (!this.logId) {
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const timestampSuffix = Date.now().toString().slice(-4);
    this.logId = `LOG-${timestampSuffix}${randomSuffix}`;
  }
  next();
});

activityLogSchema.set('toJSON', {
  transform: function (doc, ret) {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

const ActivityLog = mongoose.model('ActivityLog', activityLogSchema);

module.exports = ActivityLog;
