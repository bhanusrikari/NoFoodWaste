const mongoose = require('mongoose');

const donationSchema = new mongoose.Schema(
  {
    donor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Donor reference is required'],
    },
    donorType: {
      type: String,
      enum: ['Individual', 'Hotel', 'Restaurant', 'Caterer', 'Event Organizer', 'Organization', 'Other'],
      default: 'Individual',
    },
    foodType: {
      type: String,
      required: [true, 'Food type is required'],
      trim: true,
    },
    cuisine: {
      type: String,
      trim: true,
      default: 'Mixed',
    },
    foodItems: {
      type: String,
      trim: true,
      default: 'Food items',
    },
    quantity: {
      type: Number,
      required: [true, 'Quantity/people count is required'],
      min: [1, 'Quantity must be at least 1'],
    },
    unit: {
      type: String,
      enum: ['Meals', 'Packets', 'Kg', 'Litres', 'Boxes', 'Other'],
      default: 'Meals',
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    preparedAt: {
      type: Date,
      default: Date.now,
    },
    expiry: {
      type: Date,
    },
    pickupAddress: {
      type: String,
      trim: true,
    },
    availableFrom: {
      type: String,
      trim: true,
      default: '09:00',
    },
    availableUntil: {
      type: String,
      trim: true,
      default: '21:00',
    },
    specialInstructions: {
      type: String,
      trim: true,
      default: '',
    },
    status: {
      type: String,
      default: 'AVAILABLE',
      enum: {
        values: ['AVAILABLE', 'MATCHED', 'FULL', 'EXPIRED', 'CANCELLED', 'CLOSED', 'COMPLETED'],
        message: 'Invalid donation status',
      },
    },
  },
  {
    timestamps: true,
  }
);

donationSchema.set('toJSON', {
  transform: function (doc, ret) {
    ret.id = ret._id.toString();
    ret.location = ret.pickupAddress || ret.location || 'Location not specified';
    ret.availableDate = ret.preparedAt || ret.availableDate || ret.createdAt;
    ret.availableTime =
      ret.availableFrom && ret.availableUntil
        ? `${ret.availableFrom} - ${ret.availableUntil}`
        : ret.availableTime || ret.availableFrom || '09:00 - 21:00';
    ret.notes = ret.description || ret.specialInstructions || ret.notes || '';
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model('Donation', donationSchema);
