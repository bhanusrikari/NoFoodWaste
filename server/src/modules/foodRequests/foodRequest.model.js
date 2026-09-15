const mongoose = require('mongoose');

const foodRequestSchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Customer reference is required'],
    },
    peopleCount: {
      type: Number,
      required: [true, 'People count is required'],
      min: [1, 'People count must be at least 1'],
    },
    foodType: {
      type: String,
      required: [true, 'Food type is required'],
      trim: true,
    },
    location: {
      type: String,
      required: [true, 'Location is required'],
      trim: true,
    },
    requiredDate: {
      type: Date,
      required: [true, 'Required date is required'],
    },
    requiredTime: {
      type: String,
      required: [true, 'Required time is required'],
      trim: true,
    },
    notes: {
      type: String,
      trim: true,
      default: '',
    },
    status: {
      type: String,
      default: 'OPEN',
      enum: {
        values: ['OPEN', 'MATCHED', 'DELIVERY_ASSIGNED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'ACKNOWLEDGED', 'REJECTED', 'CANCELLED'],
        message: 'Invalid request status',
      },
    },
    // Optional Tracking Contract Integration Fields
    destinationCoords: {
      latitude: { type: Number, default: null },
      longitude: { type: Number, default: null },
    },
    pickupCoords: {
      latitude: { type: Number, default: null },
      longitude: { type: Number, default: null },
    },
    currentLocation: {
      latitude: { type: Number, default: null },
      longitude: { type: Number, default: null },
      updatedAt: { type: Date, default: null },
    },
    assignedVolunteer: {
      id: { type: String, default: null },
      name: { type: String, default: null },
      phone: { type: String, default: null },
    },
    assignedVehicle: {
      id: { type: String, default: null },
      type: { type: String, default: null },
      registrationNumber: { type: String, default: null },
    },
    eta: {
      minutes: { type: Number, default: null },
      updatedAt: { type: Date, default: null },
    },
  },
  {
    timestamps: true,
  }
);

// Transform JSON output to map _id to id and remove __v
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
