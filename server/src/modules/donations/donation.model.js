const mongoose = require('mongoose');

const donationSchema = new mongoose.Schema(
  {
    donor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Donor reference is required'],
    },
    foodType: {
      type: String,
      required: [true, 'Food type is required'],
      trim: true,
    },
    quantity: {
      type: Number,
      required: [true, 'Quantity/people count is required'],
      min: [1, 'Quantity must be at least 1'],
    },
    location: {
      type: String,
      required: [true, 'Location is required'],
      trim: true,
    },
    availableDate: {
      type: Date,
      required: [true, 'Available date is required'],
    },
    availableTime: {
      type: String,
      required: [true, 'Available time is required'],
      trim: true,
    },
    notes: {
      type: String,
      trim: true,
      default: '',
    },
    status: {
      type: String,
      default: 'AVAILABLE',
      enum: {
        values: ['AVAILABLE', 'FULL', 'EXPIRED', 'CANCELLED', 'CLOSED'],
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
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

const Donation = mongoose.model('Donation', donationSchema);

module.exports = Donation;
