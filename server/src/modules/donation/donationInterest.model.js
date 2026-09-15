const mongoose = require('mongoose');

const donationInterestSchema = new mongoose.Schema(
  {
    donation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Donation',
      required: [true, 'Donation reference is required'],
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Customer reference is required'],
    },
    status: {
      type: String,
      default: 'INTERESTED',
      enum: {
        values: ['INTERESTED', 'SELECTED', 'REJECTED', 'WITHDRAWN'],
        message: 'Invalid interest status',
      },
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to ensure uniqueness for (donation, customer) pairs
donationInterestSchema.index({ donation: 1, customer: 1 }, { unique: true });

donationInterestSchema.set('toJSON', {
  transform: function (doc, ret) {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

const DonationInterest = mongoose.model('DonationInterest', donationInterestSchema);

module.exports = DonationInterest;
