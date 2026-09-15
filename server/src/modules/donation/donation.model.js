const mongoose = require('mongoose');

const donationSchema = new mongoose.Schema(
  {
    donor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    donorType: {
      type: String,
      enum: ['Individual', 'Hotel', 'Restaurant', 'Caterer', 'Event Organizer', 'Organization', 'Other'],
      default: 'Individual',
    },
    foodType: {
      type: String,
      required: [true, 'Food type is required'],
      enum: ['Cooked Meal', 'Raw Food', 'Packaged Food', 'Bakery', 'Fruits & Vegetables', 'Beverages', 'Other'],
    },
    cuisine: {
      type: String,
      required: [true, 'Cuisine is required'],
      trim: true,
    },
    foodItems: {
      type: String,
      required: [true, 'Food items description is required'],
      trim: true,
    },
    quantity: {
      type: Number,
      required: [true, 'Quantity is required'],
      min: [1, 'Quantity must be at least 1'],
    },
    unit: {
      type: String,
      enum: ['Meals', 'Packets', 'Kg', 'Litres', 'Boxes', 'Other'],
      default: 'Meals',
    },
    description: {
      type: String,
      default: '',
    },
    preparedAt: {
      type: Date,
      required: [true, 'Prepared at time is required'],
    },
    expiry: {
      type: Date,
      required: [true, 'Expiry/Best before time is required'],
    },
    pickupAddress: {
      type: String,
      required: [true, 'Pickup address is required'],
      trim: true,
    },
    availableFrom: {
      type: String,
      required: [true, 'Pickup available from time is required'],
    },
    availableUntil: {
      type: String,
      required: [true, 'Pickup available until time is required'],
    },
    specialInstructions: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['AVAILABLE', 'MATCHED', 'COMPLETED', 'CANCELLED'],
      default: 'AVAILABLE',
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

module.exports = mongoose.model('Donation', donationSchema);
