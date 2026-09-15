const mongoose = require('mongoose');

const foodRequirementSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    organizationName: {
      type: String,
      required: [true, 'Organization or Recipient name is required'],
      trim: true,
    },
    location: {
      type: String,
      required: [true, 'Location is required'],
      trim: true,
    },
    peopleCount: {
      type: Number,
      required: [true, 'Number of people required is required'],
      min: [1, 'People count must be at least 1'],
    },
    foodType: {
      type: String,
      required: [true, 'Food type is required'],
      enum: ['Cooked Meal', 'Raw Food', 'Packaged Food', 'Bakery', 'Fruits & Vegetables', 'Beverages', 'Other'],
      default: 'Cooked Meal',
    },
    cuisine: {
      type: String,
      default: 'Any',
      trim: true,
    },
    requiredDate: {
      type: Date,
      required: [true, 'Required date is required'],
    },
    requiredTime: {
      type: String,
      required: [true, 'Required time is required'],
    },
    notes: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['OPEN', 'MATCHED', 'FULFILLED', 'CANCELLED'],
      default: 'OPEN',
    },
  },
  {
    timestamps: true,
  }
);

foodRequirementSchema.set('toJSON', {
  transform: function (doc, ret) {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model('FoodRequirement', foodRequirementSchema);
