const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
    },

    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
    },

    message: {
      type: String,
      required: [true, 'Message is required'],
      trim: true,
    },

    type: {
      type: String,
      enum: {
        values: [
          'ASSIGNMENT_CREATED',
          'ASSIGNMENT_ACCEPTED',
          'PICKUP_STARTED',
          'COLLECTION_COMPLETE',
          'TRANSPORT_STARTED',
          'DELIVERY_COMPLETE',
          'TASK_COMPLETED',
          'GENERAL',
        ],
        message: 'Invalid notification type',
      },
      default: 'GENERAL',
    },

    relatedAssignmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Assignment',
      default: null,
    },

    read: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient user notification queries
notificationSchema.index({ userId: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, read: 1 });

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