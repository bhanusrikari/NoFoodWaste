const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    notificationId: {
      type: String,
      unique: true,
      trim: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: [
        'NEW_FOOD_REQUEST',
        'NEW_DONATION',
        'MATCHING_REQUIRED',
        'DELIVERY_ASSISTANCE_REQUESTED',
        'VOLUNTEER_REJECTED',
        'DELIVERY_DELAYED',
        'DELIVERY_COMPLETED',
        'RECIPIENT_ACKNOWLEDGED',
        'CANCELLATION',
        'REPORT_SUBMITTED',
        'SYSTEM_ALERT',
      ],
      default: 'SYSTEM_ALERT',
    },
    relatedEntity: {
      type: String,
      enum: ['FoodRequest', 'Donation', 'Delivery', 'Report', 'User', 'System'],
      default: 'System',
    },
    relatedEntityId: {
      type: String,
      default: '',
      trim: true,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

notificationSchema.pre('save', async function (next) {
  if (!this.notificationId) {
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const timestampSuffix = Date.now().toString().slice(-4);
    this.notificationId = `NOTIF-${timestampSuffix}${randomSuffix}`;
  }
  next();
});

notificationSchema.set('toJSON', {
  transform: function (doc, ret) {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification;
