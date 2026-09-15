const mongoose = require('mongoose');

const foodRequestSchema = new mongoose.Schema(
  {
    donorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Donor ID is required'],
    },
    beneficiaryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Beneficiary',
      default: null,
    },
    foodType: {
      type: String,
      required: [true, 'Food type is required'],
      trim: true,
    },
    quantity: {
      value: {
        type: Number,
        required: [true, 'Quantity value is required'],
        min: [1, 'Quantity value must be at least 1'],
      },
      unit: {
        type: String,
        required: [true, 'Quantity unit is required'],
        enum: ['MEALS', 'KG', 'PACKETS', 'CONTAINERS'],
        default: 'MEALS',
      },
    },
    pickupAddress: {
      type: String,
      required: [true, 'Pickup address is required'],
      trim: true,
    },
    status: {
      type: String,
      enum: ['OPEN', 'ASSIGNED', 'FULFILLED', 'CANCELLED'],
      default: 'OPEN',
    },
  },
  {
    timestamps: true,
  }
);

foodRequestSchema.set('toJSON', {
  transform: function (doc, ret) {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

const FoodRequest = mongoose.model('FoodRequest', foodRequestSchema);

module.exports = FoodRequest;
